import { conflicts } from "./optimizer";
import type { Section } from "./planner";

export function backupSections(current: Section, alternatives: Section[], schedule: Section[]) {
  const other = schedule.filter(s => s.course !== current.course);
  const dayChanges = (s: Section) => current.days.filter(d => !s.days.includes(d)).length +
    s.days.filter(d => !current.days.includes(d)).length;
  const timeChange = (s: Section) => Math.abs(current.start - s.start) + Math.abs(current.end - s.end);
  return alternatives.filter(s => s.course === current.course && s.crn !== current.crn &&
    s.seat === "Open" && !other.some(existing => conflicts(existing, s)))
    .sort((a, b) => dayChanges(a) - dayChanges(b) || timeChange(a) - timeChange(b) ||
      Number(b.professor === current.professor) - Number(a.professor === current.professor) ||
      a.crn.localeCompare(b.crn));
}
