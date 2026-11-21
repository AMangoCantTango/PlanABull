import { AuditImport } from "./AuditImport";
import { auditOptions } from "./audit";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  CircleCheck,
  ExternalLink,
  GraduationCap,
  Layers3,
  LayoutDashboard,
  MapPin,
  PanelTop,
  Pin,
  Plus,
  Search,
  Settings2,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import {
  courseLinks,
  meeting,
  parseCatalog,
  presets,
  programs,
  quickSelect,
  sampleSections,
  type Course,
  type Section,
  type Preset,
} from "./planner";
import { conflicts, optimize } from "./optimizer";
import { loadPlanState, newPlan, savePlanState, type Plan } from "./storage";
import { WeeklySchedule, colors } from "./WeeklySchedule";
import { RegistrationCart } from "./RegistrationCart";
import { PlanArt } from "./PlanArt";
import { useSectionFeed } from "./SectionFeed";
import "./styles.css";

const navigation = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Degree plan", icon: BookOpen },
  { name: "Weekly schedule", icon: CalendarDays },
  { name: "Registration cart", icon: ShoppingBag },
];
const toggle = (items: string[], key: string) =>
  items.includes(key) ? items.filter((v) => v !== key) : [...items, key];
function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current!;
    d.showModal();
    return () => d.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="dialog-body">
        <div className="panel-head">
          <h2>{title}</h2>
          <button aria-label="Close dialog" className="round" onClick={close}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
const majorLabel = (s: string) => s.split(" B.")[0];
function App() {
  const [state, setState] = useState(loadPlanState),
    [view, setView] = useState("Overview"),
    [modal, setModal] = useState(""),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("All"),
    [paste, setPaste] = useState(""),
    [toast, setToast] = useState(""),
    [saved, setSaved] = useState(true);
  const program = programs.find((p) => p.name === state.major)!,
    plan = state.plans[state.major];
  const { feed, status } = useSectionFeed();
  const courses = useMemo<Course[]>(
    () => [
      ...program.courses,
      ...plan.custom
        .filter((code) => !program.courses.some((c) => c.code === code))
        .map((code) => {
          const known = programs
            .flatMap((p) => p.courses)
            .find((c) => c.code === code);
          return {
            code,
            title: known?.title || "Imported course",
            credits: known?.credits ?? (code.endsWith("L") ? 1 : 3),
            category: "Elective",
            semester: 0,
          };
        }),
    ],
    [program, plan.custom],
  );
  const offerings = useMemo(
    () =>
      courses.map((course, i) => ({
        course,
        sections:
          feed && course.semester
            ? feed.filter((s) => s.course === course.code)
            : sampleSections(course, i),
      })),
    [courses, feed],
  );
  const planned = useMemo(
    () => offerings.filter((o) => plan.planned.includes(o.course.code)),
    [offerings, plan.planned],
  );
  const result = useMemo(
    () => optimize(planned, plan.preset, plan.openOnly, plan.pins),
    [planned, plan.preset, plan.openOnly, plan.pins],
  );
  const sections = result.sections;
  const visibleCourses = courses.filter(
    (c) =>
      (filter === "All" || filter === c.category) &&
      (c.code + " " + c.title).toLowerCase().includes(query.toLowerCase()),
  );
  const selected = offerings.find((o) => o.course.code === modal);
  const credits = sections.reduce(
    (sum, s) => sum + courses.find((c) => c.code === s.course)!.credits,
    0,
  );
  const doneCredits = courses.reduce(
    (n, c) => n + (plan.completed.includes(c.code) ? c.credits : 0),
    0,
  );
  const campusDays = new Set(sections.flatMap((s) => s.days)).size;
  const color = (code: string) =>
    colors[
      Math.max(
        0,
        planned.findIndex((o) => o.course.code === code),
      ) % colors.length
    ];
  const parsed = parseCatalog(paste),
    fresh = parsed.filter((code) => !courses.some((c) => c.code === code));
  const activePins = planned.filter((o) => plan.pins[o.course.code]);
  const missing = planned.filter(
    (o) => !sections.some((s) => s.course === o.course.code),
  );
  function update(changes: Partial<Plan>) {
    setState((prev) => ({
      ...prev,
      plans: {
        ...prev.plans,
        [prev.major]: { ...prev.plans[prev.major], ...changes },
      },
    }));
  }
  function go(name: string) {
    setView(name);
    setModal("");
    window.scrollTo(0, 0);
  }
  function major(name: string) {
    setState((prev) => ({
      major: name,
      plans: { ...prev.plans, [name]: prev.plans[name] || newPlan(name) },
    }));
    setQuery("");
    setFilter("All");
    setModal("");
  }
  useEffect(() => {
    setSaved(savePlanState(state));
  }, [state]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);
  function pin(s: Section) {
    const pins = { ...plan.pins };
    if (pins[s.course] === s.crn) {
      delete pins[s.course];
      update({ pins });
    } else {
      pins[s.course] = s.crn;
      update({ pins, planned: [...new Set([...plan.planned, s.course])] });
    }
  }
  function complete(code: string) {
    update({
      completed: toggle(plan.completed, code),
      planned: plan.planned.filter((k) => k !== code),
    });
  }
  function importCourses() {
    update({ custom: [...new Set([...plan.custom, ...fresh])] });
    setPaste("");
    setModal("");
    setToast("Imported " + fresh.length + " courses");
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob(
        [
          sections
            .map((s) =>
              [
                s.course,
                s.number,
                s.crn,
                meeting(s),
                s.professor,
                s.sample ? "Sample section" : "",
              ].join(" · "),
            )
            .join("\n"),
        ],
        { type: "text/plain" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "PlanABull-Spring-2027.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const settings = (
    <section className="panel settings">
      <div className="panel-head">
        <div>
          <div className="kicker">PREFERENCES</div>
          <h2>Schedule optimizer</h2>
        </div>
        <SlidersHorizontal size={19} />
      </div>
      <label className="field">
        Optimization preset
        <select
          value={plan.preset}
          onChange={(e) => update({ preset: e.target.value as Preset })}
        >
          {presets.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </label>
      <label className="switch-label">
        <span>Open seats only</span>
        <input
          type="checkbox"
          checked={plan.openOnly}
          onChange={(e) => update({ openOnly: e.target.checked })}
        />
      </label>
      <small className="muted">
        Changes update your schedule automatically.
      </small>
    </section>
  );
  const termCourses = (
    <section className="panel term-list">
      <div className="panel-head">
        <div>
          <div className="kicker">THIS SEMESTER</div>
          <h2>
            Planned courses <em>{planned.length}</em>
          </h2>
        </div>
        <button
          className="round"
          title="Edit planned courses"
          onClick={() => go("Degree plan")}
        >
          <Plus size={17} />
        </button>
      </div>
      {planned.map((o) => (
        <button
          className="planned-row"
          key={o.course.code}
          onClick={() => setModal(o.course.code)}
        >
          <i style={{ background: color(o.course.code) }} />
          <span>
            <b>{o.course.code}</b>
            <small>{o.course.title}</small>
          </span>
          <small>{o.course.credits} cr</small>
        </button>
      ))}
      <button className="text-link" onClick={() => go("Degree plan")}>
        Manage degree plan <ArrowRight size={14} />
      </button>
    </section>
  );
  return (
    <div className="app">
      <aside className="sidebar">
        <button className="brand" onClick={() => go("Overview")}>
          <span className="brand-icon">
            <Layers3 size={24} strokeWidth={2.7} />
          </span>
          PlanABull
        </button>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {navigation.map(({ name, icon: Icon }) => (
            <button
              key={name}
              aria-label={name}
              aria-current={view === name ? "page" : undefined}
              className={view === name ? "nav-item active" : "nav-item"}
              onClick={() => go(name)}
            >
              <Icon size={18} />
              <span>{name}</span>
              {name === "Registration cart" && <em>{sections.length}</em>}
            </button>
          ))}
        </nav>
        <div className="side-bottom">
          <div className="nav-label">ACADEMIC PROFILE</div>
          <button className="profile" onClick={() => setModal("Major")}>
            <span className="profile-icon">
              <GraduationCap size={19} />
            </span>
            <span>
              <strong>{majorLabel(state.major)}</strong>
              <small>Undergraduate</small>
            </span>
            <Settings2 size={14} />
          </button>
          <div className="save-status">
            <i />
            {saved ? "Saved on this device" : "Local saving unavailable"}
          </div>
        </div>
      </aside>
      <main>
        <header>
          <div className="crumb">
            <PanelTop size={16} />
            Workspace <ChevronRight size={13} />
            <strong>{view}</strong>
          </div>
          <span className="university">
            <GraduationCap size={16} />
            University of South Florida
          </span>
        </header>
        <div className="content">
          <div className="page-title">
            <div>
              <div className="kicker green">REGISTRATION WORKSPACE</div>
              <h1>{view === "Overview" ? "Semester overview" : view}</h1>
            </div>
            <span className="season">
              <CalendarDays size={15} />
              Spring 2027
            </span>
          </div>
          {view === "Overview" && (
            <>
              <section className="hero">
                <PlanArt />
                <div className="hero-copy">
                  <div className="hero-tag">
                    <i /> CURRENT PLAN
                  </div>
                  <h2>Spring 2027</h2>
                  <p>
                    {majorLabel(state.major)} <span> / </span> Undergraduate
                  </p>
                  <button className="primary" onClick={() => go("Degree plan")}>
                    Open degree plan <ArrowUpRight size={15} />
                  </button>
                </div>
              </section>
              <div className="stats">
                {[
                  {
                    icon: BookOpen,
                    n: sections.length,
                    label: "Scheduled courses",
                  },
                  { icon: Layers3, n: credits, label: "Credit hours" },
                  { icon: MapPin, n: campusDays, label: "Campus days" },
                  {
                    icon: Star,
                    n: sections.length
                      ? (
                          sections.reduce((n, s) => n + s.rmp, 0) /
                          sections.length
                        ).toFixed(1)
                      : "—",
                    label: "Avg. RMP rating",
                  },
                ].map(({ icon: Icon, n, label }) => (
                  <div className="metric" key={label}>
                    <Icon size={18} />
                    <div>
                      <strong>{n}</strong>
                      <small>{label}</small>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="feed-status">
            <i />
            {status}
          </div>
          {!!missing.length && (
            <div className="notice">
              {result.errors.length
                ? "Pinned sections conflict or fail the seat filter. Review pins for "
                : "Could not schedule "}{" "}
              {missing.map((o) => (
                <button
                  className="inline-link"
                  onClick={() => setModal(o.course.code)}
                  key={o.course.code}
                >
                  {o.course.code}
                </button>
              ))}
            </div>
          )}
          {(view === "Overview" || view === "Weekly schedule") && (
            <div className="columns">
              <WeeklySchedule
                sections={sections}
                open={setModal}
                color={color}
              />
              <div className="rail">
                {settings}
                {termCourses}
                <button
                  className="pill"
                  onClick={download}
                  disabled={!sections.length}
                >
                  <ArrowDownToLine size={15} />
                  Download schedule
                </button>
              </div>
            </div>
          )}
          {view === "Degree plan" && (
            <>
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <div className="kicker">
                      2026–2027 UNDERGRADUATE CATALOG
                    </div>
                    <h2>{state.major}</h2>
                  </div>
                  <button className="pill" onClick={() => setModal("Major")}>
                    Change major
                  </button>
                </div>
                <p>
                  Named courses from the four-year plan. See the official
                  curriculum for elective choices and prerequisites.
                </p>
                <div className="actions">
                  <a
                    className="text-link"
                    target="_blank"
                    rel="noreferrer"
                    href={program.curriculum}
                  >
                    USF curriculum <ExternalLink size={13} />
                  </a>
                  <a
                    className="text-link"
                    target="_blank"
                    rel="noreferrer"
                    href={program.sequence}
                  >
                    Four-year plan <ExternalLink size={13} />
                  </a>
                </div>
                <div className="summary">
                  {doneCredits} credits completed ·{" "}
                  {planned.reduce((n, o) => n + o.course.credits, 0)} credits
                  planned
                </div>
              </section>
              <section className="panel audit-panel">
                <div className="panel-head">
                  <div>
                    <div className="kicker">DEGREEWORKS</div>
                    <h2>Remaining requirements</h2>
                  </div>
                  <button
                    className="pill"
                    onClick={() => setModal("DegreeWorks audit")}
                  >
                    {plan.audit.length
                      ? "Replace audit PDF"
                      : "Import audit PDF"}
                  </button>
                </div>
                {plan.audit.length ? (
                  <>
                    <p>
                      From your last reviewed audit. Choose the courses you want
                      to plan this term.
                    </p>
                    <ul>
                      {plan.audit.map((text) => (
                        <li key={text}>
                          {text}
                          <div className="actions">
                            {auditOptions(text).map((code) => {
                              const completed = plan.completed.includes(code),
                                planned = plan.planned.includes(code);
                              return (
                                <button
                                  className="pill"
                                  key={code}
                                  disabled={completed}
                                  aria-pressed={planned}
                                  onClick={() =>
                                    update({
                                      custom: courses.some(
                                        (c) => c.code === code,
                                      )
                                        ? plan.custom
                                        : [...plan.custom, code],
                                      planned: toggle(plan.planned, code),
                                    })
                                  }
                                >
                                  {completed
                                    ? "Completed"
                                    : planned
                                      ? "Planned"
                                      : "Plan"}{" "}
                                  {code}
                                </button>
                              );
                            })}
                          </div>
                        </li>
                      ))}
                    </ul>
                    <button
                      className="text-link"
                      onClick={() => setModal("Remove saved audit")}
                    >
                      Remove saved audit
                    </button>
                  </>
                ) : (
                  <p>
                    Import a DegreeWorks PDF to see the courses and credit
                    requirements your audit marks as still needed.
                  </p>
                )}
              </section>
              <section className="panel catalog">
                <div className="panel-head">
                  <h2>Course planner</h2>
                  <div className="actions">
                    <button
                      className="pill"
                      onClick={() => {
                        setPaste("");
                        setModal("Paste from Catalog");
                      }}
                    >
                      <Plus size={14} />
                      Paste from Catalog
                    </button>
                    <button
                      className="primary"
                      onClick={() => {
                        update({
                          planned: quickSelect(courses, plan.completed),
                        });
                        setToast("Term selection updated");
                      }}
                    >
                      <Sparkles size={15} />
                      Quick select first 4
                    </button>
                  </div>
                </div>
                <div className="search-row">
                  <label>
                    <Search size={16} />
                    <input
                      aria-label="Search courses"
                      placeholder="Search course code or title"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  <select
                    aria-label="Course category"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    {["All", "Core", "Major", "Elective"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {!visibleCourses.length && (
                  <p className="notice">No courses match this search.</p>
                )}
                {visibleCourses.map((c) => (
                  <div
                    className={
                      "course-row " +
                      (plan.completed.includes(c.code) ? "done" : "")
                    }
                    key={c.code}
                  >
                    <div>
                      <small>
                        {c.category} ·{" "}
                        {c.semester
                          ? "Sem " + c.semester
                          : "Imported · estimated credits"}{" "}
                        · {c.credits} cr
                      </small>
                      <h3>
                        <button onClick={() => setModal(c.code)}>
                          {c.code} <span>{c.title}</span>
                        </button>
                      </h3>
                    </div>
                    <div className="course-controls">
                      <label>
                        <input
                          type="checkbox"
                          checked={plan.completed.includes(c.code)}
                          onChange={() => complete(c.code)}
                        />
                        Completed
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          disabled={plan.completed.includes(c.code)}
                          checked={plan.planned.includes(c.code)}
                          onChange={() =>
                            update({ planned: toggle(plan.planned, c.code) })
                          }
                        />
                        Plan this term
                      </label>
                    </div>
                  </div>
                ))}
              </section>
            </>
          )}
          {view === "Registration cart" && (
            <RegistrationCart
              sections={sections}
              credits={credits}
              registered={plan.registered}
              toggle={(id) =>
                update({ registered: toggle(plan.registered, id) })
              }
              notify={setToast}
            />
          )}
        </div>
      </main>
      <footer>
        <div className="footer-icon">
          <ShoppingBag size={19} />
        </div>
        <div>
          <strong>Registration cart</strong>
          <small>
            {sections.length} courses · {credits} credits
          </small>
        </div>
        <span className="footer-spacer" />
        <button
          className="primary"
          onClick={() =>
            go(
              view === "Registration cart"
                ? "Weekly schedule"
                : "Registration cart",
            )
          }
        >
          {view === "Registration cart" ? "View schedule" : "Review cart"}
          <ArrowRight size={16} />
        </button>
      </footer>
      {modal === "Major" && (
        <Modal title="Choose your major" close={() => setModal("")}>
          <p>2026–2027 undergraduate catalog</p>
          {programs.map((p) => (
            <button
              className="major-row"
              key={p.name}
              onClick={() => major(p.name)}
            >
              <GraduationCap size={18} />
              {p.name}
              {p.name === state.major && <Check size={16} />}
            </button>
          ))}
        </Modal>
      )}
      {modal === "DegreeWorks audit" && (
        <Modal title="Import DegreeWorks audit" close={() => setModal("")}>
          <AuditImport
            major={state.major}
            onApply={(audit) => {
              update({ audit });
              setModal("");
              setToast("Remaining requirements saved");
            }}
          />
        </Modal>
      )}
      {modal === "Remove saved audit" && (
        <Modal title="Remove saved audit?" close={() => setModal("")}>
          <p>
            Remove the saved requirement list for {state.major}. Courses you
            planned separately stay in your semester.
          </p>
          <button
            className="pill"
            onClick={() => {
              update({ audit: [] });
              setModal("");
            }}
          >
            Remove audit
          </button>
        </Modal>
      )}
      {modal === "Paste from Catalog" && (
        <Modal title={modal} close={() => setModal("")}>
          <p>
            Paste text from the catalog, DegreeWorks, or an advising email. New
            courses use sample sections and estimated credits.
          </p>
          <textarea
            autoFocus
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder="COP 4530, CDA3103, CHM 2045L…"
            aria-label="Catalog text"
          />
          <p>
            {fresh.length} new · {parsed.length - fresh.length} already in plan
          </p>
          <div className="tags">
            {fresh.map((c) => (
              <code key={c}>{c}</code>
            ))}
          </div>
          <button
            className="primary"
            disabled={!fresh.length}
            onClick={importCourses}
          >
            Import courses <Plus size={15} />
          </button>
        </Modal>
      )}
      {selected && (
        <Modal
          title={selected.course.code + " · Sections"}
          close={() => setModal("")}
        >
          <p>
            {selected.course.title} · {selected.course.credits} credits
          </p>
          <div className="actions">
            <a
              target="_blank"
              rel="noreferrer"
              href={courseLinks(selected.course.code).catalog}
            >
              USF course details ↗
            </a>
            <a
              target="_blank"
              rel="noreferrer"
              href={courseLinks(selected.course.code).coursicle}
            >
              Coursicle ↗
            </a>
          </div>
          {plan.pins[selected.course.code] &&
            !selected.sections.some(
              (s) => s.crn === plan.pins[selected.course.code],
            ) && (
              <button
                className="pill"
                onClick={() => {
                  const pins = { ...plan.pins };
                  delete pins[selected.course.code];
                  update({ pins });
                }}
              >
                Clear unavailable pin
              </button>
            )}
          {!selected.sections.length && <p>No sections in the current feed.</p>}
          {selected.sections.map((s) => {
            const pinned = plan.pins[s.course] === s.crn;
            const blocked = activePins.some(
              (o) =>
                o.course.code !== s.course &&
                o.sections.some(
                  (other) =>
                    other.crn === plan.pins[o.course.code] &&
                    conflicts(other, s),
                ),
            );
            return (
              <article className="section-card" key={s.crn}>
                <div className="panel-head">
                  <b>
                    Section {s.number} · CRN {s.crn}
                  </b>
                  <span className={"seat " + s.seat}>{s.seat}</span>
                </div>
                <h3>{s.professor}</h3>
                <small>
                  {meeting(s)} {s.sample ? "· Sample section" : ""}
                </small>
                <p>
                  RMP {s.rmp.toFixed(1)}/5 · Difficulty {s.difficulty}/5 ·{" "}
                  {s.again}% would take again · {s.reviews} reviews
                </p>
                <p>Coursicle {s.coursicle.toFixed(1)}/5</p>
                <div className="actions">
                  <a
                    href={
                      "https://www.ratemyprofessors.com/search/professors/1262?q=" +
                      encodeURIComponent(s.professor)
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    Verify RMP ↗
                  </a>
                  <button
                    className="pill"
                    disabled={
                      !pinned &&
                      (plan.completed.includes(s.course) ||
                        blocked ||
                        (plan.openOnly && s.seat !== "Open"))
                    }
                    onClick={() => pin(s)}
                  >
                    <Pin size={13} />
                    {pinned
                      ? "Unpin section"
                      : blocked
                        ? "Conflicts with pin"
                        : "Pin section"}
                  </button>
                </div>
              </article>
            );
          })}
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <CircleCheck size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
