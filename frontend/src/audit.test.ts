import { describe, expect, it } from "vitest";
import { readRequirements, auditOptions, requiredAuditCourse } from "./audit";

describe("DegreeWorks audit", () => {
  it("keeps requirements including choices and non-course conditions, excluding nearby transcript rows", () => {
    expect(
      readRequirements([
        [
          "English Composition ENC 1101 A 3 Fall 2025",
          "Algorithms Still Needed: 1 Class in COP 4530 or",
          "COP 4600",
          "Complete COP 2510 Spring 2025",
          "Still needed:",
          "6 Credits in upper-level electives",
          "Still needed: 6 Credits in upper-level electives",
        ],
      ]),
    ).toEqual([
      "1 Class in COP 4530 or COP 4600",
      "6 Credits in upper-level electives",
    ]);
  });
  it("does not turn a course list, in-progress row or page header into an unmet requirement", () => {
    expect(
      readRequirements([
        ["In Progress COP 4600", "Still needed:"],
        ["Student Name Example", "Course Title Credits", "ENC 1101"],
      ]),
    ).toEqual([]);
  });
  it("expands shorthand options but leaves range and wildcard choices for review", () => {
    expect(auditOptions("1 Class in CHM 2045L or 2046L")).toEqual([
      "CHM 2045L",
      "CHM 2046L",
    ]);
    expect(auditOptions("3 Credits in COP 3000-4999")).toEqual([]);
    expect(auditOptions("6 Credits in COP 4@ except COP 4530")).toEqual([]);
  });
});

it("only prepares unambiguous named audit courses", () => {
  expect(requiredAuditCourse("1 Class in CHM 2045L")).toBe("CHM 2045L");
  expect(requiredAuditCourse("COP 4530 or COP 4600")).toBeUndefined();
  expect(requiredAuditCourse("6 Credits in COP 4@ except COP 4530")).toBeUndefined();
});
