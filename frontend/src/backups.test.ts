import { expect, it } from "vitest";
import { backupSections } from "./backups";
import { programs, sampleSections, type Section } from "./planner";

it("ranks same-day alternatives first and excludes conflicts, closed sections and the primary", () => {
  const base = sampleSections(programs[0].courses[0], 0)[0];
  const current = { ...base, days: [0], start: 600, end: 650 };
  const alt = (crn: string, changes: Partial<Section> = {}) => ({ ...current, crn, ...changes });
  const near = alt("10001", { start: 610, end: 660 });
  const nextDay = alt("10002", { days: [1] });
  const blocked = alt("10003", { days: [2] });
  const other = { ...blocked, course: "OTHER", crn: "10004" };
  expect(backupSections(current, [nextDay, current, blocked, alt("10005", {seat:"Closed"}), near],
    [current, other])).toEqual([near, nextDay]);
});
