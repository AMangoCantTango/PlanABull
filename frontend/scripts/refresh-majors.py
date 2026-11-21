"""Refresh built-in USF programs from the public catalog and its plans of study."""
import concurrent.futures
import json
import re
import time
from html import unescape
from pathlib import Path
from urllib.request import urlopen

import pymupdf

SRC = Path(__file__).resolve().parents[1] / "src"
BASE = "https://catalog.usf.edu/widget-api/catalog/21"
CODE = r"([A-Z]{3})\s*(\d{4}[A-Z]?)"


def fetch(url):
    for attempt in range(3):
        try:
            with urlopen(url, timeout=30) as response:
                return response.read()
        except OSError:
            if attempt == 2:
                raise
            time.sleep(attempt + 1)


def walk(cores):
    for core in cores:
        yield core
        yield from walk(core.get("children") or [])


def program(entry):
    data = json.loads(fetch(f"{BASE}/program/{entry['id']}/"))
    cores = list(walk(data["cores"]))
    options = {}
    for core in cores:
        for course in core.get("courses") or []:
            match = re.match(CODE + r"\s*[-–]\s*(.+)", unescape(course["title"]).strip())
            if match:
                prefix, number, title = match.groups()
                code = prefix + " " + number
                options.setdefault(code, dict(code=code, title=title.strip(), semester=0,
                    credits=1 if number.endswith("L") else 3,
                    category="Elective" if "elective" in core["name"].lower() else "Major"))
    links = [(url, label) for core in cores if "plan" in core["name"].lower()
             for url, label in re.findall(r'href="(https://usf\.box\.com/s/\w+)"[^>]*>([^<]+)', core.get("description") or "", re.I)]
    sequence = next((url for url, label in links if re.search(r"4[\s-]*year", label, re.I)), "")
    scheduled = {}
    if sequence:
        try:
            pdf = fetch(sequence.replace("/s/", "/shared/static/") + ".pdf")
            with pymupdf.open(stream=pdf, filetype="pdf") as doc:
                semester = 0
                for page in doc:
                    for line in page.get_text(sort=True).splitlines():
                        term = re.search(r"Semester\s+(\d+)\s*[-–]", line, re.I)
                        if term:
                            semester = int(term[1])
                        row = re.match(r"\s*" + CODE + r"\s*[-–]\s*(.*?)\s+(\d+)\s*$", line)
                        if row and semester:
                            prefix, number, title, credits = row.groups()
                            code = prefix + " " + number
                            scheduled.setdefault(code, dict(code=code, title=options.get(code, {}).get("title", title),
                                semester=semester, credits=int(credits), category=options.get(code, {}).get("category", "Major")))
        except (OSError, RuntimeError, ValueError):
            pass  # The curriculum can still be used without a readable term sequence.
    return dict(name=entry["name"].strip(), curriculum=f"https://catalog.usf.edu/preview_program.php?catoid=25&poid={entry['legacy-id']}",
                sequence=sequence, courses=list(scheduled.values()) + [c for k,c in options.items() if k not in scheduled])


if __name__ == "__main__":
    existing = {p["name"] for p in json.loads((SRC / "catalog.json").read_text())}
    entries = []
    page = 1
    while True:
        response = json.loads(fetch(f"{BASE}/programs/?page-size=100&page={page}"))
        entries.extend(response["program-list"])
        if len(entries) >= response["count"]:
            break
        page += 1
    majors = [p for p in entries if p["status"]["active"] and p["status"]["visible"]
              and any(t["name"] == "Major" for t in p["program_types"]) and p["name"].strip() not in existing]
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        result = list(pool.map(program, majors))
    path = SRC / "majorDirectory.json"
    path.write_text(json.dumps(result, ensure_ascii=True, separators=(",", ":")), encoding="utf-8")
    print("Additional majors:", len(result), "with semester data:", sum(any(c["semester"] for c in p["courses"]) for p in result),
          "without named courses:", [p["name"] for p in result if not p["courses"]])
