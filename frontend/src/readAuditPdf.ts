import { readRequirements } from "./audit";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = workerUrl;
export async function readAuditPdf(file: File, signal: AbortSignal) {
  if (file.size > 25 * 1024 * 1024)
    throw new Error("Choose a PDF smaller than 25 MB.");
  const data = await file.arrayBuffer();
  signal.throwIfAborted();
  const task = getDocument({ data, useSystemFonts: true });
  const cancel = () => {
    void task.destroy();
  };
  signal.addEventListener("abort", cancel, { once: true });
  try {
    const doc = await task.promise;
    const pages: string[][] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      signal.throwIfAborted();
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      const parts = content.items.flatMap((item) =>
        "str" in item && item.str.trim()
          ? [
              {
                text: item.str.trim(),
                x: item.transform[4],
                y: item.transform[5],
              },
            ]
          : [],
      );
      parts.sort((a, b) => b.y - a.y);
      const rows: (typeof parts)[] = [];
      for (const part of parts) {
        const row = rows.at(-1);
        if (row && Math.abs(row[0].y - part.y) <= 2) row.push(part);
        else rows.push([part]);
      }
      pages.push(
        rows.map((row) =>
          row
            .sort((a, b) => a.x - b.x)
            .map((p) => p.text)
            .join(" "),
        ),
      );
      page.cleanup();
    }
    if (!pages.some((p) => p.length))
      throw new Error(
        "This PDF has no selectable text. Export or print a text PDF from DegreeWorks, then try again.",
      );
    return readRequirements(pages);
  } finally {
    signal.removeEventListener("abort", cancel);
    await task.destroy();
  }
}
