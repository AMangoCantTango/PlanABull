import { describe, it, expect } from "vitest";
import { conflicts, optimize } from "./optimizer";
import {
  parseCatalog,
  sampleSections,
  programs,
  type Section,
} from "./planner";
const course = programs[0].courses[0],
  base = sampleSections(course, 0)[0];
const section = (crn: string, changes: Partial<Section> = {}): Section => ({
  ...base,
  crn,
  ...changes,
});
describe("schedule optimizer", () => {
  it("detects a single minute of overlap, permits adjacent times, distinct days, and async sections", () => {
    expect(
      conflicts(
        base,
        section("2", { start: base.end - 1, end: base.end + 60 }),
      ),
    ).toBe(true);
    expect(
      conflicts(base, section("2", { start: base.end, end: base.end + 60 })),
    ).toBe(false);
    expect(conflicts(base, section("2", { days: [4] }))).toBe(false);
    expect(conflicts(base, section("2", { days: [] }))).toBe(false);
  });
  it("filters closed and waitlisted sections before ranking", () => {
    const sections = [
      section("1", { seat: "Closed", rmp: 5 }),
      section("2", { seat: "Waitlist", rmp: 4.9 }),
      section("3", { rmp: 3 }),
    ];
    expect(
      optimize([{ course, sections }], "Highest Professor Rating", true, {})
        .sections[0].crn,
    ).toBe("3");
    expect(
      optimize([{ course, sections }], "Highest Professor Rating", false, {})
        .sections[0].crn,
    ).toBe("1");
  });
  it("uses the exact 10 AM cutoff", () => {
    const sections = [
      section("1", { start: 599, rmp: 5 }),
      section("2", { start: 600, rmp: 4 }),
    ];
    expect(
      optimize([{ course, sections }], "No Early Mornings", true, {})
        .sections[0].crn,
    ).toBe("2");
  });
  it("backtracks past a better-rated clash and respects a hard pin", () => {
    const a = section("1", { rmp: 5 }),
      b = section("2", { days: [4] }),
      c = section("3", { course: "COP 4530" });
    const groups = [
      { course, sections: [a, b] },
      { course: { ...course, code: c.course }, sections: [c] },
    ];
    expect(
      optimize(groups, "Balanced", true, {}).sections.map((s) => s.crn),
    ).toEqual(["2", "3"]);
    expect(
      optimize(groups, "Balanced", true, { [course.code]: "1" }).sections.map(
        (s) => s.crn,
      ),
    ).toEqual(["1"]);
    expect(
      optimize(groups, "Balanced", true, {
        [course.code]: "1",
        [c.course]: "3",
      }).errors,
    ).toContain(c.course);
  });
  it("compacts commute days across the whole schedule", () => {
    const groups = [
      { course, sections: [base] },
      {
        course: { ...course, code: "ENC 1101" },
        sections: [
          section("2", { course: "ENC 1101", days: [4], rmp: 5 }),
          section("3", {
            course: "ENC 1101",
            start: base.end,
            end: base.end + 60,
            rmp: 4,
          }),
        ],
      },
    ];
    expect(optimize(groups, "Compact Days", true, {}).sections[1].crn).toBe(
      "3",
    );
  });
  it("normalizes catalog text, preserves lab suffixes and removes duplicates", () => {
    expect(
      parseCatalog(
        "COP 4530, cda3103; cop4530 / CHM 2045L / CHM2045. XCOP1234 COP12345",
      ),
    ).toEqual(["COP 4530", "CDA 3103", "CHM 2045L", "CHM 2045"]);
  });
});
