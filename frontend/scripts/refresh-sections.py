"""Refresh Spring 2027 schedulable USF sections for subjects in the major catalog."""
import json
import re
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html import unescape
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[2]
SOURCE = "https://usfweb.usf.edu/DSS/StaffScheduleSearch/StaffSearch/Results"
TERM = "202701"


def minutes(value):
    clock = datetime.strptime(value.strip(), "%I:%M%p")
    return clock.hour * 60 + clock.minute


def subject_rows(subject):
    body = urlencode({"P_SEMESTER": TERM, "P_SUBJ": subject}).encode()
    for attempt in range(3):
        try:
            with urlopen(SOURCE, data=body, timeout=60) as response:
                page = response.read().decode("utf-8", "replace")
            if "Spring 2027" not in page:
                raise ValueError("Unexpected schedule response for " + subject)
            break
        except OSError:
            if attempt == 2:
                raise
            time.sleep(2)
    result = {}
    excluded = set()
    for row in re.findall(r"<tr\b[^>]*>(.*?)</tr>", page, re.I | re.S):
        cells = re.findall(r"<td\b[^>]*>(.*?)</td>", row, re.I | re.S)
        c = [" ".join(unescape(re.sub("<[^>]*>", " ", v)).split()) for v in cells]
        if len(c) != 24 or not re.fullmatch(r"\d{5}", c[3]) or c[4].split()[:1] != [subject]:
            continue
        crn = c[3]
        # The planner currently supports one weekly meeting pattern per CRN.
        if crn in result or re.search(r"<br\b", cells[16] + cells[17], re.I):
            excluded.add(crn)
            continue
        times = re.fullmatch(r"(\d{1,2}:\d{2}[ap]m)\s*-\s*(\d{1,2}:\d{2}[ap]m)", c[17], re.I)
        if not times or not re.fullmatch("[MTWRF]+", c[16]):
            continue
        if c[10] not in ("Open", "Closed", "Waitlist") or c[11] != "A":
            continue
        result[crn] = dict(course=c[4], number=c[5], crn=crn, professor=c[20] or "Instructor unlisted",
                           days=["MTWRF".index(d) for d in c[16]], start=minutes(times[1]), end=minutes(times[2]),
                           seat=c[10], sample=False)
    return [s for crn, s in result.items() if crn not in excluded]


if __name__ == "__main__":
    subjects = set()
    for name in ("catalog", "majorDirectory"):
        programs = json.loads((ROOT / f"frontend/src/{name}.json").read_text(encoding="utf-8"))
        subjects.update(c["code"].split()[0] for p in programs for c in p["courses"])
    with ThreadPoolExecutor(max_workers=5) as pool:
        sections = [s for group in pool.map(subject_rows, sorted(subjects)) for s in group]
    if not sections:
        raise ValueError("No schedulable USF sections returned")
    output = dict(term=TERM, retrieved=datetime.now(timezone.utc).date().isoformat(), sections=sections)
    (ROOT / "public/usf-sections.json").write_text(json.dumps(output, separators=(",", ":")), encoding="utf-8")
    print(len(sections), "sections in snapshot")
