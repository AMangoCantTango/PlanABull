// Refresh the named courses in USF's four-year plans. Requires Node 22+ and pdftotext.
import { execFileSync } from "node:child_process";
import { writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const base = "https://catalog.usf.edu/widget-api/catalog/21";
async function request(url) {
  let response;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      response = await fetch(url);
      break;
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
  if (!response.ok)
    throw new Error(`USF returned ${response.status} for ${url}`);
  return response;
}
const cache = new Map();
async function courseDetails(code) {
  if (cache.has(code)) return cache.get(code);
  const [prefix, number] = code.split(" ");
  const list = await (
    await request(
      `${base}/courses/?prefix=${prefix}&code=${number}&page-size=100&page=1`,
    )
  ).json();
  const course = list["course-list"].find((c) =>
    c.title.replace(/\s+/g, " ").startsWith(code + " "),
  );
  if (!course) throw new Error("Missing catalog record for " + code);
  const detail = await (await request(`${base}/course/${course.id}/`)).json();
  const creditText = detail.fields.find(
    (f) => f.custom_field.name === "Credit(s):",
  )?.content;
  if (!/^\d+$/.test(creditText))
    throw new Error("Variable or missing credits for " + code);
  const result = {
    code,
    title: detail.name.trim(),
    credits: Number(creditText),
  };
  cache.set(code, result);
  return result;
}

const plans = [];
const temp = await mkdtemp(join(tmpdir(), "usf-plans-"));
try {
  for (const id of [8244, 8245, 8248, 8864]) {
    const program = await (await request(`${base}/program/${id}/`)).json();
    const links = program.cores.find((core) =>
      core.name.startsWith("Plans of Study"),
    ).description;
    const key = links.match(
      /href="https:\/\/usf\.box\.com\/s\/([a-z0-9]+)"[^>]*>[^<]*4.Year/i,
    )[1];
    const file = join(temp, id + ".pdf");
    await writeFile(
      file,
      Buffer.from(
        await (
          await request(`https://usf.box.com/shared/static/${key}.pdf`)
        ).arrayBuffer(),
      ),
    );
    const rows = execFileSync(
      process.env.PDFTOTEXT || "pdftotext",
      ["-layout", file, "-"],
      { encoding: "utf8" },
    );
    const courses = [];
    let semester = 0;
    for (const line of rows.split(/\r?\n/)) {
      const term = line.match(/Semester (\d+)\s*-/);
      if (term) semester = Number(term[1]);
      const row = line.trim().match(/^([A-Z]{3})\s*(\d{4}[CL]?)\b/);
      if (!row || !semester) continue;
      const codes = line
        .trim()
        .split(/\s{2,}/)[0]
        .match(/[A-Z]{3}\s*\d{4}[CL]?/g);
      for (const raw of codes) {
        const code = raw.replace(/\s/g, "").replace(/^(...)/, "$1 ");
        if (courses.some((c) => c.code === code)) continue;
        const details = await courseDetails(code);
        const category = / OR |Elective/i.test(line)
          ? "Elective"
          : /^(ENC|MAC|PHY|AMH|POS|MAD)/.test(code)
            ? "Core"
            : "Major";
        courses.push({ ...details, category, semester });
      }
    }
    plans.push({
      name: program.name,
      curriculum: `https://catalog.usf.edu/preview_program.php?catoid=25&poid=${program["legacy-id"]}`,
      sequence: "https://usf.box.com/s/" + key,
      courses,
    });
    console.log(program.name, courses.length);
  }
  await writeFile(
    new URL("../src/catalog.json", import.meta.url),
    JSON.stringify(plans, null, 2) + "\n",
  );
} finally {
  await rm(temp, { recursive: true, force: true });
}

