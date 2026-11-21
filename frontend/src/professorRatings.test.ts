import { expect, it } from "vitest";
import type { Section } from "./planner";
import { withProfessorRating } from "./professorRatings";

const section = { course: "MAC 2311", professor: "I. Chitikov" } as Section;

it("matches the published professor profile across calculus sections", () => {
  expect(withProfessorRating(section).rmp).toBe(2.9);
  expect(withProfessorRating({ ...section, course: "MAC 2312", professor: "igor chitikov" }).profileUrl)
    .toBe("https://www.ratemyprofessors.com/professor/158483");
  expect(withProfessorRating({ ...section, course: "ART 2311" }).rmp).toBeUndefined();
});

it("keeps a valid feed rating with its RMP source and leaves unknown staff unrated", () => {
  const incoming = { ...section, professor: "Other Instructor", rmp: 4.2, profileUrl: "https://www.ratemyprofessors.com/professor/1234" };
  expect(withProfessorRating(incoming).rmp).toBe(4.2);
  expect(withProfessorRating({ ...incoming, professor: "Staff", profileUrl: undefined }).rmp).toBeUndefined();
});
