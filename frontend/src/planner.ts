import additionalPrograms from "./majorDirectory.json";
import catalog from "./catalog.json";

export interface Course {
  code: string;
  title: string;
  credits: number;
  category: string;
  semester: number;
}
export const programs: typeof catalog = [...catalog, ...additionalPrograms];
export const presets = [
  "Balanced",
  "Highest Professor Rating",
  "No Early Mornings",
  "Compact Days",
] as const;
export type Preset = (typeof presets)[number];
export type Seat = "Open" | "Waitlist" | "Closed";
export interface Section {
  course: string;
  number: string;
  crn: string;
  professor: string;
  days: number[];
  start: number;
  end: number;
  seat: Seat;
  rmp: number;
  difficulty: number;
  again: number;
  reviews: number;
  coursicle: number;
  sample: boolean;
}
export interface Offering {
  course: Course;
  sections: Section[];
}
export function parseCatalog(text: string) {
  return [
    ...new Set(
      Array.from(
        text.toUpperCase().matchAll(/\b([A-Z]{3})[ \t\r\n-]*(\d{4}[CL]?)\b/g),
        (m) => m[1] + " " + m[2],
      ),
    ),
  ];
}
export const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
export function time(minute: number) {
  const hour = Math.floor(minute / 60);
  return `${hour % 12 || 12}:${String(minute % 60).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}
export function meeting(s: Section) {
  return s.days.length
    ? s.days.map((d) => weekdays[d]).join("/") +
        " · " +
        time(s.start) +
        "–" +
        time(s.end)
    : "Online · Asynchronous";
}
const professors = [
  "Alex Morgan",
  "Jordan Chen",
  "Taylor Rivera",
  "Sam Patel",
  "Casey Brooks",
  "Avery Ellis",
  "Morgan Lee",
  "Riley Diaz",
];
export function sampleSections(course: Course, index: number): Section[] {
  return Array.from({ length: 4 }, (_, variant) => {
    const slot = (index + variant) % 6;
    const start = [600, 660, 780, 870, 540, 960][slot];
    return {
      course: course.code,
      number: ["001", "002", "003", "W01"][variant],
      crn: String(14000 + index * 4 + variant),
      professor: professors[(index + 2 * variant) % professors.length],
      days: variant === 3 ? [] : slot % 2 ? [1, 3] : [0, 2],
      start,
      end: start + 75,
      seat: (
        ["Open", index % 2 ? "Waitlist" : "Closed", "Open", "Open"] as Seat[]
      )[variant],
      rmp: [4.7, 4.9, 4.3, 3.8][variant],
      difficulty: [2.8, 2.4, 3.2, 3.5][variant],
      again: [91, 98, 87, 79][variant],
      reviews: 21 + ((index * 5 + variant) % 65),
      coursicle: [4.6, 4.8, 4.1, 3.9][variant],
      sample: true,
    };
  });
}
export function courseLinks(code: string) {
  const [dept, num] = code.split(" ");
  return {
    coursicle: `https://www.coursicle.com/usf/courses/${dept}/${num}/`,
    catalog: `https://cloud.usf.edu/academic-programs/details/prefix/${dept}/code/${num}`,
  };
}
export function quickSelect(courses: Course[], completed: string[]) {
  const remaining = courses.filter((c) => !completed.includes(c.code));
  // Pick the first four available courses from one catalog term when possible.
  const terms = [...new Set(remaining.map((c) => c.semester))].filter(Boolean);
  for (const term of terms) {
    const first = remaining.filter((c) => c.semester === term).slice(0, 4);
    const credits = first.reduce((sum, c) => sum + c.credits, 0);
    if (first.length === 4 && credits >= 12 && credits <= 15)
      return first.map((c) => c.code);
  }
  return remaining.slice(0, 4).map((c) => c.code);
}
