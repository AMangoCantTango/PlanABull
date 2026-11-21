import { useEffect, useState } from "react";
import type { Section } from "./planner";
function section(value: unknown): value is Section {
  if (!value || typeof value !== "object") return false;
  const s = value as Section;
  return (
    typeof s.course === "string" &&
    typeof s.number === "string" &&
    typeof s.professor === "string" &&
    typeof s.crn === "string" &&
    /^\d{5}$/.test(s.crn) &&
    Array.isArray(s.days) &&
    s.days.every((d) => Number.isInteger(d) && d >= 0 && d < 5) &&
    Number.isInteger(s.start) &&
    Number.isInteger(s.end) &&
    (!s.days.length || (s.start >= 0 && s.start < s.end && s.end <= 1440)) &&
    ["Open", "Waitlist", "Closed"].includes(s.seat) &&
    [s.rmp, s.coursicle, s.difficulty].every(
      (n) => Number.isFinite(n) && n >= 0 && n <= 5,
    ) &&
    Number.isInteger(s.reviews) &&
    s.reviews >= 0 &&
    Number.isFinite(s.again) &&
    s.again >= 0 &&
    s.again <= 100
  );
}
export function useSectionFeed() {
  const [feed, setFeed] = useState<Section[] | null>(null);
  const [status, setStatus] = useState(
    import.meta.env.VITE_API_URL
      ? "Connecting to section feed"
      : "Sample sections, ratings and seats",
  );
  useEffect(() => {
    const base = import.meta.env.VITE_API_URL;
    if (!base) return;
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 10000);
    let active = true;
    async function load() {
      try {
        const res = await fetch(
          base.replace(/\/+$/, "") + "/courses?term=202701",
          { signal: abort.signal },
        );
        if (!res.ok) throw new Error();
        const body = await res.json();
        if (
          body.term !== "202701" ||
          !Array.isArray(body.sections) ||
          !body.sections.every(section) ||
          new Set(body.sections.map((s: Section) => s.crn)).size !==
            body.sections.length
        )
          throw new Error();
        if (active) {
          setFeed(body.sections.map((s: Section) => ({ ...s, sample: false })));
          setStatus("Connected section feed");
        }
      } catch {
        if (active) setStatus("Feed unavailable · Sample sections, ratings and seats");
      }
    }
    load();
    return () => {
      active = false;
      clearTimeout(timeout);
      abort.abort();
    };
  }, []);
  return { feed, status };
}

