import records from "./professorRatings.json";
import type { Section } from "./planner";

const normalize = (name: string) => name.trim().toLowerCase().replaceAll(".", "").replace(/\s+/g, " ");
const profiles = new Map<string, typeof records[number] | null>();
for (const record of records) {
  for (const subject of record.subjects) {
    for (const name of [record.roster, record.professor]) {
      const key = subject + "|" + normalize(name);
      const previous = profiles.get(key);
      profiles.set(key, previous === undefined || previous?.profileUrl === record.profileUrl ? record : null);
    }
  }
}

function numeric(value: unknown, maximum: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= maximum ? value : undefined;
}

export function withProfessorRating(s: Section): Section {
  // A sourced rating from the configured feed takes precedence over the bundled snapshot.
  const score = numeric(s.rmp, 5);
  if (score !== undefined && score >= 1 && /^https:\/\/(?:www\.)?ratemyprofessors\.com\/professor\/\d+\/?$/.test(s.profileUrl ?? "")) {
    return { ...s, sample: false, difficulty: numeric(s.difficulty, 5), again: numeric(s.again, 100),
      reviews: Number.isInteger(s.reviews) ? numeric(s.reviews, Number.MAX_SAFE_INTEGER) : undefined, coursicle: undefined };
  }
  const subject = s.course.trim().toUpperCase().match(/^[A-Z]+/)?.[0];
  const profile = profiles.get(subject + "|" + normalize(s.professor));
  return { ...s, sample: false, professor: profile?.professor ?? s.professor,
    rmp: profile?.rmp, difficulty: profile?.difficulty, again: profile?.again, reviews: profile?.reviews,
    profileUrl: profile?.profileUrl, coursicle: undefined };
}
