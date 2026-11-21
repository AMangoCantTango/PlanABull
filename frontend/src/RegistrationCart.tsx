import { Fragment, useState } from "react";
import { backupSections } from "./backups";
import { Copy, ExternalLink } from "lucide-react";
import { meeting, type Offering, type Section } from "./planner";
export function RegistrationCart({
  sections,
  credits,
  chooseProfessor,
  notify,
  missing, remove, offerings, backups, saveBackup, applyBackup, feedStatus,
}: {
  offerings: Offering[];
  backups: Record<string, string>;
  saveBackup: (course: string, crn?: string) => void;
  applyBackup: (section: Section) => void;
  feedStatus: string;
  sections: Section[];
  credits: number;
  chooseProfessor: (code: string) => void;
  missing: string[];
  remove: (code: string) => void;
  notify: (s: string) => void;
}) {
  const [expanded, setExpanded] = useState("");
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      notify("Copied " + value);
    } catch {
      notify(
        "Clipboard unavailable. Select the displayed CRNs to copy manually.",
      );
    }
  }
  const ids = sections.map((s) => s.crn);
  return (
    <section className="panel cart">
      <div className="kicker">SPRING 2027</div>
      <h2>Registration worksheet</h2>
      <p>
        {sections.length} scheduled courses / {credits} credits. Select a course to choose its professor and meeting time.
      </p>
      {sections.some((s) => s.sample) && (
        <p className="notice">
          Sample CRNs are for practice. Verify each CRN in MyUSF before
          registering.
        </p>
      )}
      {sections.map((s) => {
        const saved = backups[s.course];
        const open = expanded === s.course;
        const candidates = open ? backupSections(s, offerings.find(o => o.course.code === s.course)?.sections ?? [], sections) : [];
        return <Fragment key={s.course}>
        <div className="cart-row" key={s.crn}>
          <button className="cart-course" aria-label={"Choose professor for " + s.course} onClick={() => chooseProfessor(s.course)}>
            <span>
              <b>
                {s.course} · {s.number}
              </b>
              <small>
                {s.professor} · {meeting(s)}
              </small>
            </span>
          </button>
          <button className="pill" aria-label={"Remove " + s.course} onClick={() => remove(s.course)}>Remove</button>
          <button className="pill" aria-expanded={open} onClick={() => setExpanded(open ? "" : s.course)}>
            {saved ? "View backup" : "Find a backup"}
          </button>
          <code>{s.crn}</code>
          <button title={"Copy " + s.crn} onClick={() => copy(s.crn)}>
            <Copy size={16} />
          </button>
        </div>
        {open && <section className="backup-options" aria-label={"Backup sections for " + s.course}>
          <h3>Backup for {s.course}</h3>
          <p>{feedStatus}. Confirm seats in MyUSF before registering.</p>
          {saved && <p>Saved CRN {saved}.{" "}
            {!candidates.some(c => c.crn === saved) && "This section is no longer an eligible alternative. "}
            <button className="text-link" onClick={() => saveBackup(s.course)}>Clear backup</button>
          </p>}
          {!candidates.length && <p>No open alternative fits your current schedule.</p>}
          {candidates.map(c => <div className="cart-row" key={c.crn}>
            <span><b>{c.professor} ? Section {c.number}</b><small>{meeting(c)} ? CRN {c.crn}</small></span>
            {saved === c.crn
              ? <button className="pill" onClick={() => { applyBackup(c); setExpanded(""); }}>Use backup</button>
              : <button className="pill" onClick={() => saveBackup(s.course, c.crn)}>Save as backup</button>}
          </div>)}
          {candidates.length > 0 && <p>Using a backup pins your other scheduled sections at their current times.</p>}
        </section>}
        </Fragment>;
      })}
      {missing.map(code => <div className="cart-row" key={code}>
        <button className="cart-course" aria-label={"Choose professor for " + code} onClick={() => chooseProfessor(code)}>
          <span><b>{code}</b><small>No section scheduled under current preferences</small></span>
        </button>
        <button className="pill" aria-label={"Remove " + code} onClick={() => remove(code)}>Remove</button>
      </div>)}
      {!ids.length && !missing.length && <p>Plan courses to add sections to your cart.</p>}
      <p className="crns">{ids.join(", ")}</p>
      <div className="actions">
        <button
          className="pill"
          disabled={!ids.length}
          onClick={() => copy(ids.join(", "))}
        >
          <Copy size={15} />
          Copy all CRNs
        </button>
        <a
          className="primary"
          target="_blank"
          rel="noreferrer"
          href="https://studentssb9.it.usf.edu/StudentRegistrationSsb/ssb/registration"
        >
          Open class registration <ExternalLink size={15} />
        </a>
      </div>
    </section>
  );
}
