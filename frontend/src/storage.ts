import {
  presets,
  programs,
  quickSelect,
  parseCatalog,
  type Preset,
} from "./planner";

export interface Plan {
  audit: string[];
  planned: string[];
  completed: string[];
  custom: string[];
  pins: Record<string, string>;
  registered: string[];
  preset: Preset;
  openOnly: boolean;
}
export interface State {
  major: string;
  plans: Record<string, Plan>;
}
const key = "planabull_state_v1";
export function newPlan(name: string): Plan {
  const courses = programs.find((p) => p.name === name)!.courses;
  return {
    planned: quickSelect(courses, []),
    audit: [],
    completed: [],
    custom: [],
    pins: {},
    registered: [],
    preset: "Balanced",
    openOnly: true,
  };
}
const strings = (x: unknown): string[] =>
  Array.isArray(x)
    ? [...new Set(x.filter((s): s is string => typeof s === "string"))]
    : [];
export function loadPlanState(): State {
  const fallback = {
    major: programs[0].name,
    plans: { [programs[0].name]: newPlan(programs[0].name) },
  };
  try {
    const data = JSON.parse(localStorage.getItem(key) || "null");
    if (!data) {
      const old = JSON.parse(localStorage.getItem("planabull-plan") || "null");
      if (Array.isArray(old)) {
        const plan = fallback.plans[fallback.major];
        plan.planned = parseCatalog(strings(old).join(" "));
        plan.custom = plan.planned.filter(
          (code) => !programs[0].courses.some((c) => c.code === code),
        );
      }
      return fallback;
    }
    if (!programs.some((p) => p.name === data.major)) return fallback;
    const plans: State["plans"] = {};
    for (const program of programs) {
      const s = data.plans?.[program.name];
      if (!s || typeof s !== "object") continue;
      const completed = strings(s.completed);
      plans[program.name] = {
        planned: strings(s.planned).filter((c) => !completed.includes(c)),
        audit: strings(s.audit),
        completed,
        custom: parseCatalog(strings(s.custom).join(" ")),
        registered: strings(s.registered),
        pins: Object.fromEntries(
          Object.entries(s.pins || {}).filter(
            (entry): entry is [string, string] => typeof entry[1] === "string",
          ),
        ),
        preset: presets.includes(s.preset) ? s.preset : "Balanced",
        openOnly: s.openOnly !== false,
      };
    }
    plans[data.major] ??= newPlan(data.major);
    return { major: data.major, plans };
  } catch {
    return fallback;
  }
}
export function savePlanState(state: State) {
  try {
    localStorage.setItem(key, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
