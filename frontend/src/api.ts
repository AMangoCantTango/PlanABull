const API_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

type CatalogCourse = {
  code: string;
  name: string;
  credits: number;
  sections: {
    id: string;
    days: (keyof typeof weekdays)[];
    start: string;
    end: string;
    seats_available: number;
  }[];
};

export type Course = {
  id: string;
  code: string;
  title: string;
  credits: number;
  days: number[];
  hour: number;
  endHour: number;
  startLabel: string;
  time: string;
  seatsAvailable: number;
  category: string;
  color: string;
  glyph: string;
};

const weekdays = { M: "Mon", T: "Tue", W: "Wed", R: "Thu", F: "Fri" };
const dayCodes = Object.keys(weekdays);
const subjectColors: Partial<Record<string, string>> = {
  COP: "mint",
  CDA: "peach",
  STA: "blue",
  ENC: "rose",
};

function toHour(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours + minutes / 60;
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = Number(hours);
  return `${hour % 12 || 12}:${minutes} ${hour < 12 ? "AM" : "PM"}`;
}

export async function getCourses(signal?: AbortSignal): Promise<Course[]> {
  const response = await fetch(`${API_URL}/courses`, { signal });

  if (!response.ok) {
    throw new Error("Failed to fetch courses");
  }

  const { courses }: { courses: CatalogCourse[] } = await response.json();
  return courses.flatMap((course) => {
    const subject = course.code.split(" ")[0];
    return course.sections.map((section) => ({
      id: section.id,
      code: course.code,
      title: course.name,
      credits: course.credits,
      days: section.days.map((day) => dayCodes.indexOf(day)),
      hour: toHour(section.start),
      endHour: toHour(section.end),
      startLabel: formatTime(section.start),
      time: `${section.days.map((day) => weekdays[day]).join(", ")} · ${formatTime(section.start)} – ${formatTime(section.end)}`,
      seatsAvailable: section.seats_available,
      category: subject,
      color: subjectColors[subject] ?? "lavender",
      glyph: subject,
    }));
  });
}

export async function getHealth(): Promise<unknown> {
  const response = await fetch(`${API_URL}/health`);

  if (!response.ok) {
    throw new Error("Backend is unavailable");
  }

  return response.json();
}
