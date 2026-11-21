import { Copy, ExternalLink } from "lucide-react";
import { meeting, type Section } from "./planner";
export function RegistrationCart({
  sections,
  credits,
  chooseProfessor,
  notify,
  missing, remove,
}: {
  sections: Section[];
  credits: number;
  chooseProfessor: (code: string) => void;
  missing: string[];
  remove: (code: string) => void;
  notify: (s: string) => void;
}) {
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
      {sections.map((s) => (
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
          <code>{s.crn}</code>
          <button title={"Copy " + s.crn} onClick={() => copy(s.crn)}>
            <Copy size={16} />
          </button>
        </div>
      ))}
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
          href="https://my.usf.edu/"
        >
          Open MyUSF / OASIS <ExternalLink size={15} />
        </a>
      </div>
    </section>
  );
}
