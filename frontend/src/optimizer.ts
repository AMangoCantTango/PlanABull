import type { Offering, Preset, Section } from "./planner";

export function conflicts(a: Section, b: Section) {
  return (
    a.start < b.end &&
    b.start < a.end &&
    a.days.some((day) => b.days.includes(day))
  );
}
function quality(s: Section, preset: Preset) {
  const rating = s.rmp + s.coursicle + s.again / 100;
  if (preset === "Highest Professor Rating") return rating * 10;
  const early = s.days.length && s.start < 600;
  return rating - (early ? (preset === "No Early Mornings" ? 100 : 1) : 0);
}
export function optimize(
  offerings: Offering[],
  preset: Preset,
  openOnly: boolean,
  pins: Record<string, string>,
) {
  const locked: Section[] = [];
  const errors: string[] = [];
  const groups: Section[][] = [];
  for (const { course, sections } of offerings) {
    const eligible = sections.filter((s) => !openOnly || s.seat === "Open");
    if (pins[course.code]) {
      const pinned = eligible.find((s) => s.crn === pins[course.code]);
      if (!pinned || locked.some((s) => conflicts(pinned, s)))
        errors.push(course.code);
      else locked.push(pinned);
    } else
      groups.push(
        eligible.sort((a, b) => quality(b, preset) - quality(a, preset)),
      );
  }
  if (errors.length) return { sections: [], errors };
  const chosen = [...locked];
  let best: Section[] = [],
    bestScore = -Infinity;
  const seen = new Map<string, number>();
  function search(index: number, score: number) {
    if (chosen.length + groups.length - index < best.length) return;
    // Equal occupancy gives identical future choices, including the final commute penalty.
    const occupied = chosen
      .filter((s) => s.days.length)
      .map((s) => [s.days.join(""), s.start, s.end].join(":"))
      .sort()
      .join("/");
    const key = index + "|" + chosen.length + "|" + occupied;
    if ((seen.get(key) ?? -Infinity) >= score) return;
    seen.set(key, score);
    if (index === groups.length) {
      const days = new Set(chosen.flatMap((s) => s.days)).size;
      const penalty =
        preset === "Compact Days" ? 8 : preset === "Balanced" ? 0.35 : 0;
      const total = score - days * penalty;
      if (
        chosen.length > best.length ||
        (chosen.length === best.length && total > bestScore)
      ) {
        best = [...chosen];
        bestScore = total;
      }
      return;
    }
    for (const s of groups[index]) {
      if (chosen.some((other) => conflicts(s, other))) continue;
      chosen.push(s);
      search(index + 1, score + quality(s, preset));
      chosen.pop();
    }
    search(index + 1, score);
  }
  search(0, 0);
  return { sections: best, errors };
}
