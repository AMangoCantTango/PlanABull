import { Copy, ExternalLink } from "lucide-react";
import { meeting, type Section } from "./planner";
export function RegistrationCart({
  sections,
  credits,
  registered,
  toggle,
  notify,
}: {
  sections: Section[];
  credits: number;
  registered: string[];
  toggle: (id: string) => void;
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
        {sections.length} courses · {credits} credits ·{" "}
        {ids.filter((id) => registered.includes(id)).length}/{ids.length} marked
        registered
      </p>
      {sections.some((s) => s.sample) && (
        <p className="notice">
          Sample CRNs are for practice. Verify each CRN in MyUSF before
          registering.
        </p>
      )}
      {sections.map((s) => (
        <div className="cart-row" key={s.crn}>
          <label>
            <input
              type="checkbox"
              checked={registered.includes(s.crn)}
              onChange={() => toggle(s.crn)}
            />
            <span>
              <b>
                {s.course} · {s.number}
              </b>
              <small>
                {s.professor} · {meeting(s)}
              </small>
            </span>
          </label>
          <code>{s.crn}</code>
          <button title={"Copy " + s.crn} onClick={() => copy(s.crn)}>
            <Copy size={16} />
          </button>
        </div>
      ))}
      {!ids.length && <p>Plan courses to add sections to your cart.</p>}
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
