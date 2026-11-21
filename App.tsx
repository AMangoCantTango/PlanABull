import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  BookOpen, CheckCheck, ChevronDown, Sparkles,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Compass,
  GraduationCap,
  LayoutDashboard,
  ListFilter,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Star,
  Trash2,
  X,
  Bookmark,
  CircleHelp,
  SlidersHorizontal,
  Download,
} from "lucide-react";
import "./styles.css";

type Course = {
  id: string;
  title: string;
  professor: string;
  credits: number;
  rating: string;
  reviews: number;
  days: number[];
  hour: number;
  time: string;
  room: string;
  color: string;
  category: string;
  crn: string;
  glyph: string;
};
const courses: Course[] = [
  {
    id: "COP 3514",
    title: "Program Design",
    professor: "Alex Morgan",
    credits: 3,
    rating: "4.8",
    reviews: 42,
    days: [0, 2],
    hour: 10,
    time: "Mon, Wed · 10:00–11:15 AM",
    room: "Tampa · ENG 104",
    color: "mint",
    category: "Major core",
    crn: "21041",
    glyph: "{ }",
  },
  {
    id: "COT 3100",
    title: "Intro to Discrete Structures",
    professor: "Jordan Chen",
    credits: 3,
    rating: "4.6",
    reviews: 36,
    days: [1, 3],
    hour: 11.5,
    time: "Tue, Thu · 11:30 AM–12:45 PM",
    room: "Tampa · CIS 201",
    color: "lavender",
    category: "Major core",
    crn: "21042",
    glyph: "∑",
  },
  {
    id: "CDA 3103",
    title: "Computer Organization",
    professor: "Taylor Rivera",
    credits: 3,
    rating: "4.7",
    reviews: 29,
    days: [0, 2],
    hour: 13,
    time: "Mon, Wed · 1:00–2:15 PM",
    room: "Tampa · ENB 118",
    color: "peach",
    category: "Major core",
    crn: "21043",
    glyph: "⌘",
  },
  {
    id: "STA 2023",
    title: "Introductory Statistics",
    professor: "Sam Patel",
    credits: 3,
    rating: "4.5",
    reviews: 61,
    days: [1, 3],
    hour: 14,
    time: "Tue, Thu · 2:00–3:15 PM",
    room: "Tampa · CMC 130",
    color: "blue",
    category: "Math & science",
    crn: "21044",
    glyph: "↗",
  },
  {
    id: "ENC 3246",
    title: "Communication for Engineers",
    professor: "Casey Brooks",
    credits: 3,
    rating: "4.9",
    reviews: 24,
    days: [4],
    hour: 10,
    time: "Fri · 10:00–11:15 AM",
    room: "Tampa · CPR 122",
    color: "rose",
    category: "General education",
    crn: "21045",
    glyph: "Aa",
  },
];
const initialIds = courses.slice(0, 4).map((c) => c.id);
function loadSaved(): string[] | null {
  try {
    const data = JSON.parse(localStorage.getItem("planabull-plan") || "null");
    return Array.isArray(data)
      ? data.filter(
          (id: unknown) =>
            typeof id === "string" && courses.some((c) => c.id === id),
        )
      : null;
  } catch {
    return null;
  }
}
function App() {
  const [view, setView] = useState("Overview");
  const [selected, setSelected] = useState<string[]>(
    () => loadSaved() ?? initialIds,
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All courses");
  const [modal, setModal] = useState<"preferences" | "registration" | null>(
    null,
  );
  const [toast, setToast] = useState("");
  const [saved, setSaved] = useState(!!loadSaved());
  const [savedIds, setSavedIds] = useState<string[] | null>(() => loadSaved());
  const [noFriday, setNoFriday] = useState(false);
  const [lateStart, setLateStart] = useState(true);
  const [target, setTarget] = useState(12);
  const [variant, setVariant] = useState(0);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModal(null);
      if (event.key === "Tab") {
        const elements = Array.from(
          document.querySelectorAll<HTMLElement>(
            ".modal button:not(:disabled), .modal input, .modal select, .modal a",
          ),
        );
        const first = elements[0],
          last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [modal]);
  const chosen = courses.filter((c) => selected.includes(c.id));
  const credits = chosen.reduce((n, c) => n + c.credits, 0);
  const visible = courses.filter(
    (c) =>
      `${c.id} ${c.title} ${c.professor}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "All courses" || c.category === filter),
  );
  const notify = (s: string) => {
    setToast(s);
    window.setTimeout(() => setToast(""), 3500);
  };
  const toggle = (id: string) => {
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );
    setSaved(false);
  };
  function save() {
    try {
      localStorage.setItem("planabull-plan", JSON.stringify(selected));
      setSavedIds([...selected]);
      setSaved(true);
      notify("Your plan is saved on this device.");
    } catch {
      notify("This browser could not save your plan.");
    }
  }
  function generate() {
    const eligible = courses.filter(
      (c) => (!noFriday || !c.days.includes(4)) && (!lateStart || c.hour >= 10),
    );
    const count = Math.min(target / 3, eligible.length);
    const shift = (variant + 1) % eligible.length;
    const rotated = [...eligible.slice(shift), ...eligible.slice(0, shift)];
    setSelected(rotated.slice(0, count).map((c) => c.id));
    setVariant((v) => v + 1);
    setSaved(false);
    notify("Sample plan updated.");
  }
  function exportPlan() {
    const blob = new Blob(
      [
        `PlanABull · Spring 2027 SAMPLE PLAN\nNot live registration data.\n\n${chosen.map((c) => `${c.id} — ${c.title}\nSample CRN: ${c.crn}\n${c.time}\n`).join("\n")}`,
      ],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "planabull-sample-plan.txt";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="app">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setView("Overview");
          }}
        >
          <span className="brand-icon"><GraduationCap size={25}/></span>planabull<span className="brand-period">.</span>
        </a>
        <div className="workspace"><span className="usf-mark">U</span>
          <div>
            <strong>University of South Florida</strong>
            <span>Tampa campus</span>
          </div>
        </div>
        <div className="nav-caption">YOUR WORKSPACE</div>
        <nav>
          {[
            { name: "Overview", icon: LayoutDashboard },
            { name: "Degree plan", icon: GraduationCap },
            { name: "Explore courses", icon: Compass },
            { name: "My schedule", icon: CalendarDays },
            { name: "Saved plans", icon: Bookmark },
          ].map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={view === name ? "nav-item active" : "nav-item"}
              onClick={() => setView(name)}
            >
              <Icon size={19} />
              {name}
              {name === "Saved plans" && (
                <span className="nav-count">{saved ? 1 : 0}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-plan">
          <div className="small-label">THE BIG PICTURE</div>
          <div className="degree-icon"><GraduationCap size={23}/></div><h3>One semester closer.</h3>
          <p>Every good plan starts with<br/>knowing where you’re headed.</p>
          <div className="tiny-progress">
            <span />
          </div>
          <div className="progress-note">
            <strong>54 / 120</strong>
            <span>credits complete</span>
          </div>
          <button onClick={() => setView("Degree plan")}>
            View degree progress <ArrowUpRight size={15} />
          </button>
        </div>
        <button
          className="help"
          onClick={() =>
            notify(
              "Prototype: select courses, adjust preferences, and save your plan locally.",
            )
          }
        >
          <CircleHelp size={18} /> A little help?
        </button>
        <div className="profile">
          <div className="avatar">JB</div>
          <div>
            <strong>Jordan Bennett</strong>
            <span>Computer Science · B.S.</span>
          </div>
          <button
            aria-label="Profile preferences"
            onClick={() => setModal("preferences")}
          >
            <Settings2 size={17} />
          </button>
        </div>
      </aside>
      <main>
        <header>
          <div className="breadcrumb">
            Your workspace <ChevronRight size={13} />
            <span>{view}</span>
          </div>
          <div className="header-right">
            <span className="demo-label">SAMPLE DATA</span>
            <button className="term" onClick={()=>notify("This prototype includes Spring 2027 sample data only.")}><CalendarDays size={15}/>Spring 2027<ChevronDown size={14}/></button>
            <div className="mini-avatar">JB</div>
          </div>
        </header>
        <div className="main-content">
          <div className="greeting">
            <div>
              <div className="eyebrow">A LITTLE PLANNING. A LOT OF POSSIBILITY.</div>
              <h1>
                {view === "Overview"
                  ? "Your semester, sorted."
                  : view === "Degree plan"
                    ? "Your path to graduation."
                    : view === "Explore courses"
                      ? "Find your next favorite class."
                      : view === "Saved plans"
                        ? "Good plans are worth keeping."
                        : "Make room for what matters."}
              </h1>
              <p>
                {view === "Overview" ? "Less tab-hopping. More moving forward. Let’s build a schedule that fits you." : "Your courses, your preferences, your next step forward."}
              </p>
            </div>
            <button
              className="outline preferences"
              onClick={() => setModal("preferences")}
            >
              <SlidersHorizontal size={16} /> Preferences
            </button>
          </div>
<section className="hero"><div className="hero-copy"><span className="tag"><Sparkles size={13}/> BUILT AROUND YOU</span><h2>A smarter semester.<br/>A little more you.</h2><p>Your degree requirements, professor preferences, and life<br className="desktop-br"/> outside the classroom. Finally, on the same page.</p><button className="primary" onClick={generate}><Sparkles size={17}/>Build my schedule</button><span className="hero-foot">Your next great semester starts here.</span></div><div className="hero-art" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="art-card art-back"><div className="art-top"><span/><span/><span/></div><div className="art-lines"><i/><i/><i/></div></div><div className="art-card art-front"><div className="art-card-title"><CalendarDays size={17}/> YOUR WEEK, REIMAGINED <Check size={16}/></div><div className="mini-calendar">{Array.from({length:20},(_,i)=><div key={i} className={[1,7,10,16].includes(i)?'mini-event':'mini-cell'}/>)}</div><div className="art-bottom"><span className="art-check"><Check size={12}/></span>No conflicts. More possibilities.</div></div><div className="floating-badge"><Sparkles size={15}/> Made for your next chapter</div></div></section>
<div className="stats"><div><span className="stat-icon"><GraduationCap size={20}/></span><div><span>Degree progress</span><strong>45<span>%</span><small>54 of 120 credits</small></strong></div><div className="stat-ring">45%</div></div><div><span className="stat-icon"><BookOpen size={20}/></span><div><span>Planned this semester</span><strong>{credits}<small>credits · {chosen.length} courses</small></strong></div></div><div><span className="stat-icon"><CheckCheck size={20}/></span><div><span>Schedule check</span><strong className="stat-text">{chosen.length?'Looking good':'Ready to build'}<small>{chosen.length?'No time conflicts':'Add a course to get started'}</small></strong></div><span className="good-dot"/></div></div>
          <div className="content-grid">
            <div className="left-column">
              {view === "Degree plan" ? (
                <section className="panel degree-panel">
                  <div className="section-title">
                    <div>
                      <h2>Your degree, at a glance</h2>
                      <p>Computer Science B.S. · Sample 2025–26 catalog</p>
                    </div>
                    <GraduationCap size={22} />
                  </div>
                  {[
                    { name: "General education", done: 30, total: 36 },
                    { name: "Math & science", done: 18, total: 24 },
                    { name: "Major core", done: 6, total: 45 },
                    { name: "Electives", done: 0, total: 15 },
                  ].map((r) => (
                    <div className="requirement" key={r.name}>
                      <div>
                        <strong>{r.name}</strong>
                        <span>
                          {r.done} / {r.total} credits
                        </span>
                      </div>
                      <div className="requirement-track">
                        <span
                          style={{ width: `${(r.done / r.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <p className="sample-note">
                    Illustrative requirements only. Official catalog rules and
                    transfer credit evaluation are not connected.
                  </p>
                </section>
              ) : view === "Saved plans" ? (
                <section className="panel saved-panel">
                  <Bookmark size={28} />
                  <h2>{savedIds ? "Spring 2027" : "No saved plan"}</h2>
                  <p>
                    {saved
                      ? `${credits} credits in your current plan. Saved locally on this device.`
                      : "Choose your courses, then save your plan to find it here."}
                  </p>
                  <button
                    className="primary"
                    onClick={() => {
                      if (savedIds) {
                        setSelected([...savedIds]);
                        setSaved(true);
                        setView("My schedule");
                        setQuery("");
                        setFilter("All courses");
                      } else save();
                    }}
                  >
                    {savedIds ? "Open saved plan" : "Save current plan"}
                  </button>
                </section>
              ) : (
                <section className="recommendations">
                  <div className="section-title">
                    <div>
                      <h2>
                        {view === "My schedule"
                          ? "Courses in your plan"
                          : "Your next moves"}
                        <span className="subtle-tag">
                          {view === "My schedule"
                            ? chosen.length
                            : "Recommended"}
                        </span>
                      </h2>
                      <p>
                        {view === "My schedule"
                          ? "Everything you’ve added to your semester."
                          : "Courses that move your degree forward."}
                      </p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() =>
                        setView(
                          view === "Explore courses"
                            ? "Overview"
                            : "Explore courses",
                        )
                      }
                    >
                      {view === "Explore courses"
                        ? "Back to overview"
                        : "Explore all"}
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                  <div className="course-tools">
                    <label className="search">
                      <Search size={17} />
                      <input
                        aria-label="Search courses or professors"
                        placeholder="Search courses or professors"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                      {query && (
                        <button
                          aria-label="Clear search"
                          onClick={() => setQuery("")}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </label>
                    <label className="filter">
                      <ListFilter size={15} />
                      <select
                        aria-label="Course category"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                      >
                        {[
                          "All courses",
                          "Major core",
                          "Math & science",
                          "General education",
                        ].map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="course-list">
                    {visible
                      .filter(
                        (c) =>
                          view !== "My schedule" || selected.includes(c.id),
                      )
                      .map((c) => (
                        <article className="course" key={c.id}>
                          <div className={`course-art ${c.color}`}><span>{c.glyph}</span><small>{c.id.split(' ')[0]}</small></div><div className="course-info">
                            <div className="course-meta">
                              {c.id}
                              <span>·</span>
                              {c.credits} credits
                              <span className="category">{c.category}</span>
                            </div>
                            <h3>{c.title}</h3>
                            <div className="professor">
                              {c.professor}
                              <span className="rating">
                                <Star size={12} fill="currentColor" />
                                {c.rating}
                              </span>
                              <span className="review-count">
                                ({c.reviews})
                              </span>
                            </div>
                            <div className="course-time">
                              <Clock3 size={12} />
                              {c.time}
                            </div>
                          </div>
                          <button
                            aria-label={`${selected.includes(c.id) ? "Remove" : "Add"} ${c.id}`}
                            className={`add-course ${selected.includes(c.id) ? "added" : ""}`}
                            onClick={() => toggle(c.id)}
                          >
                            {selected.includes(c.id)?<Check size={19}/>:<Plus size={19}/>}
                          </button>
                        </article>
                      ))}
                    {visible.filter(
                      (c) => view !== "My schedule" || selected.includes(c.id),
                    ).length === 0 && (
                      <p className="empty">
                        No courses match. Try another search or category.
                      </p>
                    )}
                  </div>
                  <div className="ratings-note">
                    <ShieldCheck size={14} />
                    Illustrative courses, instructors, and ratings. No live data
                    connected.
                  </div>
                </section>
              )}
            </div>
            <section className="panel schedule">
              <div className="section-title">
                <div>
                  <h2>Your week, at a glance</h2>
                  <p>A little structure. A lot of breathing room.</p>
                </div>
                <CalendarDays size={18} />
              </div>
              <div className="schedule-toolbar">
                <span>Spring 2027</span>
                <div>
                  <span className="schedule-dot" /> {chosen.length} courses{" "}
                  <span className="divider">/</span> {credits} credits
                </div>
              </div>
              <div className="calendar-scroll">
                <div className="calendar">
                  <div className="calendar-heading">
                    <span />
                    {["MON", "TUE", "WED", "THU", "FRI"].map((d) => (
                      <span key={d}>{d}</span>
                    ))}
                  </div>
                  <div className="calendar-body">
                    <div className="hours">
                      {[9, 10, 11, 12, 13, 14, 15, 16].map((h) => (
                        <span key={h}>
                          {h > 12 ? h - 12 : h}
                          <small>{h < 12 ? "AM" : "PM"}</small>
                        </span>
                      ))}
                    </div>
                    <div className="day-columns">
                      {[0, 1, 2, 3, 4].map((day) => (
                        <div className="day-column" key={day}>
                          {chosen
                            .filter((c) => c.days.includes(day))
                            .map((c) => (
                              <button
                                title={`${c.title} · ${c.time}`}
                                onClick={() => {
                                  setQuery(c.id);
                                  setView("My schedule");
                                }}
                                key={c.id}
                                className={`calendar-event ${c.color}`}
                                style={{
                                  top: `${(c.hour - 9) * 44}px`,
                                  height: "55px",
                                }}
                              >
                                <strong>{c.id.replace(" ", "\n")}</strong>
                                <span>
                                  {c.hour % 1
                                    ? "11:30"
                                    : `${c.hour > 12 ? c.hour - 12 : c.hour}:00`}
                                </span>
                              </button>
                            ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="schedule-summary">
                <span>
                  <Check size={14} />{" "}
                  {chosen.length
                    ? "Conflict-free sample schedule"
                    : "Your week is a blank canvas"}
                </span>
                <button onClick={() => setView("My schedule")}>
                  Full schedule
                  <ArrowUpRight size={13} />
                </button>
              </div>
              <button className="generate-another" onClick={generate}>
                <Sparkles size={15}/>Try another combination
              </button>
            </section>
          </div>
          <div className="bottom-tip"><span className="tip-icon"><Sparkles size={17}/></span><p><strong>Your future self says thanks.</strong> A balanced schedule leaves room for everything else.</p><span>GO BULLS.</span></div><footer>Built for Bulls. Designed around you.<span>Frontend prototype · Nothing is submitted to USF.</span></footer>
        </div>
      </main>
      <div className="plan-bar">
        <div className="plan-bar-icon">
          <CalendarDays size={21} />
        </div>
        <div>
          <strong>Spring 2027 plan</strong>
          <span>
            {chosen.length} courses <b>·</b> {credits} credits <b>·</b>{" "}
            {saved ? "Saved on this device" : "Unsaved changes"}
          </span>
        </div>
        <div className="plan-bar-actions">
          <button className="text-button save-button" onClick={save}>
            {saved ? <Check size={16} /> : <Bookmark size={16} />}{" "}
            {saved ? "Saved" : "Save plan"}
          </button>
          <button
            className="primary"
            disabled={!chosen.length}
            onClick={() => setModal("registration")}
          >
            Review my plan
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="Close dialog"
              autoFocus
              onClick={() => setModal(null)}
            >
              <X size={20} />
            </button>
            {modal === "preferences" ? (
              <>
                <span className="eyebrow">MAKE IT YOURS</span>
                <h2 id="modal-title">Your semester, your rules.</h2>
                <p>Choose preferences for the sample schedule builder.</p>
                <label className="preference-row">
                  <span>
                    <strong>Keep Fridays free</strong>
                    <small>A little more room for the weekend.</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={noFriday}
                    onChange={(e) => setNoFriday(e.target.checked)}
                  />
                </label>
                <label className="preference-row">
                  <span>
                    <strong>Start at 10 AM or later</strong>
                    <small>
                      All sample sections already meet this preference.
                    </small>
                  </span>
                  <input
                    type="checkbox"
                    checked={lateStart}
                    onChange={(e) => setLateStart(e.target.checked)}
                  />
                </label>
                <label className="credit-select">
                  Target credit load
                  <select
                    value={target}
                    onChange={(e) => setTarget(Number(e.target.value))}
                  >
                    <option value={9}>9 credits</option>
                    <option value={12}>12 credits</option>
                    <option value={15}>15 credits</option>
                  </select>
                </label>
                {noFriday && target === 15 && (
                  <p className="sample-note">
                    Only 12 credits of sample sections meet the Friday
                    preference.
                  </p>
                )}
                <button
                  className="primary modal-primary"
                  onClick={() => {
                    generate();
                    setModal(null);
                  }}
                >
                  <Sparkles size={16}/>Apply &amp; build schedule
                </button>
              </>
            ) : (
              <>
                <span className="eyebrow">YOUR NEXT CHAPTER</span>
                <h2 id="modal-title">Looking like a good semester.</h2>
                <p>
                  {credits} credits · {chosen.length} courses · Spring 2027
                </p>
                <div className="review-courses">
                  {chosen.map((c) => (
                    <div key={c.id}>
                      <span>
                        <strong>{c.id}</strong>
                        <small>{c.title}</small>
                      </span>
                      <button
                        aria-label={`Remove ${c.id}`}
                        onClick={() => toggle(c.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="review-warning">
                  <ShieldCheck size={20} />
                  <p>
                    This is a sample plan. CRNs, instructors, and availability
                    are illustrative. No enrollment is performed. Confirm actual
                    courses and eligibility in USF Student Self-Service.
                  </p>
                </div>
                <button
                  className="primary modal-primary"
                  disabled={!chosen.length}
                  onClick={exportPlan}
                >
                  <Download size={16} />
                  Download sample plan
                </button>
                <a
                  className="registration-link"
                  href="https://www.usf.edu/registrar/register/index.aspx"
                  target="_blank"
                  rel="noreferrer"
                >
                  USF registration resources <ArrowUpRight size={15} />
                </a>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
