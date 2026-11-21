import { parseCatalog } from "./planner";

const marker = /\bstill\s+needed\s*:\s*/i;
const boundary =
  /^(?:legend|disclaimer|student (?:name|id)|page \d|in.progress|completed|insufficient|fallthrough|exceptions|course\s+title|electives allowed|courses applied)\b/i;
const transcript =
  /\b(?:Fall|Spring|Summer)\s+(?:19|20)\d\d\b|\b(?:IP|TR|[ABCDF][+-]?)\s+\(?\d+(?:\.\d+)?\)?\s*$/i;

// Only explicit unmet rows establish a requirement. Keep "or", wildcards and
// credit counts in the original wording instead of inferring degree rules.
export function readRequirements(pages: string[][]) {
  const result: string[] = [];
  for (const page of pages) {
    let current: string | null = null;
    const flush = () => {
      if (current?.trim()) result.push(current.trim());
      current = null;
    };
    for (const raw of page) {
      const line = raw.replace(/\s+/g, " ").trim();
      if (!line) continue;
      const match = marker.exec(line);
      if (match) {
        flush();
        current = line.slice(match.index + match[0].length);
      } else if (current !== null) {
        if (boundary.test(line) || transcript.test(line)) flush();
        else if (
          !current ||
          /(?:\bor|\band|\bin|\bfrom|\bof|[,;:])$/i.test(current) ||
          /^(?:or|and|except|excluding|with attribute)\b/i.test(line)
        ) {
          current = (current + " " + line).trim();
        } else flush();
      }
    }
    flush();
  }
  return [...new Set(result)];
}

export function auditOptions(requirement: string) {
  // A range, exclusion or attribute condition needs interpretation before a
  // course can be selected. Preserve its text and avoid actionable guesses.
  if (
    /@|\b(?:except|excluding|through|with attribute)\b|\d\s*[-–]\s*(?:[A-Z]{3}\s*)?\d/i.test(
      requirement,
    )
  )
    return [];
  const expanded = requirement.replace(
    /\b([A-Z]{3})\s*(\d{4}[CL]?)((?:\s*(?:or|and|,)\s*\d{4}[CL]?\b)+)/gi,
    (_, dept: string, num: string, rest: string) =>
      dept +
      " " +
      num +
      rest.replace(/\b\d{4}[CL]?\b/gi, (n) => dept + " " + n),
  );
  return parseCatalog(expanded);
}
