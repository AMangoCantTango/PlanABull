import { useEffect, useState } from "react";
import { withProfessorRating } from "./professorRatings";
import type { Section } from "./planner";
function section(value: unknown): value is Section {
  if (!value || typeof value !== "object") return false;
  const s = value as Section;
  return (
    s.sample !== true &&
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
    ["Open", "Waitlist", "Closed"].includes(s.seat)
  );
}
export function useSectionFeed() {
  const [feed, setFeed] = useState<Section[] | null>(null);
  const [status, setStatus] = useState(
    "Loading USF schedule",
  );
  useEffect(() => {
    const base = import.meta.env.VITE_API_URL;

    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 10000);
    let active = true;
    async function load() {
      try {
        const res = await fetch(
          base ? base.replace(/\/+$/, "") + "/courses?term=202701" : import.meta.env.BASE_URL + "usf-sections.json",
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
          setFeed(body.sections.map(withProfessorRating));
          setStatus(body.retrieved ? "USF schedule snapshot: " + body.retrieved : "Connected section feed");
        }
      } catch {
        if (active) setStatus("Section feed unavailable");
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

