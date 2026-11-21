import { useEffect, useRef, useState } from "react";

import { courseRequirements } from "./audit";

export function AuditImport({
  major,
  onApply,
}: {
  major: string;
  onApply: (entries: string[]) => void;
}) {
  const [rows, setRows] = useState<{ text: string; keep: boolean }[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  async function read(file: File) {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    setRows([]);
    setMessage("");
    try {
      const { readAuditPdf } = await import("./readAuditPdf");
      const entries = courseRequirements(await readAuditPdf(file, controller.signal));
      if (controller.signal.aborted) return;
      setRows(entries.map((text) => ({ text, keep: true })));
      setMessage(
        entries.length
          ? "Select the classes to save."
          : "No specific needed classes were found in this audit.",
      );
    } catch (error) {
      if (controller.signal.aborted) return;
      setMessage(
        error instanceof Error && error.name === "PasswordException"
          ? "This PDF is password protected. Export an unlocked copy."
          : error instanceof Error &&
              /^(This PDF has no|Choose a PDF)/.test(error.message)
            ? error.message
            : "Could not read this PDF. Try a text-based PDF exported from DegreeWorks.",
      );
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  const kept = [
    ...new Set(
      rows
        .filter((r) => r.keep)
        .map((r) => r.text.trim())
        .filter(Boolean),
    ),
  ];
  return (
    <div className="audit-import">
      <p>
        Choose your DegreeWorks audit for <b>{major}</b>. The PDF stays in this
        browser. Only the requirements you confirm are saved.
      </p>
      <label className="field">
        DegreeWorks audit PDF
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void read(file);
            e.target.value = "";
          }}
        />
      </label>
      <p role="status">{busy ? "Reading audit…" : message}</p>
      {rows.map((row, i) => (
        <label className="audit-edit" key={i}>
          <input
            type="checkbox"
            aria-label={"Include requirement " + (i + 1)}
            checked={row.keep}
            onChange={() =>
              setRows((r) =>
                r.map((v, j) => (i === j ? { ...v, keep: !v.keep } : v)),
              )
            }
          />
          <span>{row.text}</span>
        </label>
      ))}
      {!!rows.length && (
        <>
          <p>Applying replaces the saved audit requirements for this major.</p>
          <button
            className="primary"
            disabled={!kept.length || busy}
            onClick={() => onApply(kept)}
          >
            Save selected classes
          </button>
        </>
      )}
    </div>
  );
}
