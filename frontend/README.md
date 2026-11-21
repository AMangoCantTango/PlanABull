# PlanABull

A USF registration planner built with React, TypeScript, and Vite. Run `npm install` and `npm run dev` to open the frontend. Use `npm test` for the Vitest suite and `npm run build` for a production bundle.

## Curriculum

The major picker uses a bundled USF undergraduate catalog. Each major opens its own course list, schedule, and saved audit. Semester numbers and credits come from readable named course rows in the published four-year sequence when available. Other curriculum options are listed without a semester and use estimated credits. Consult the linked curriculum for prerequisites, alternatives, and variable credit amounts. Refresh the additional major snapshots using `python frontend/scripts/refresh-majors.py` from the repository root with PyMuPDF installed.

To refresh the snapshot, run `node scripts/refresh-catalog.mjs` with Poppler's pdftotext on PATH, or set PDFTOTEXT to its executable. The script reads the public USF catalog widget, the four-year plans linked from each curriculum, and official course-credit fields.

## Sections and registration

The default Spring 2027 workspace uses simulated sections, ratings, seats, and CRNs. The optimizer maximizes the number of planned courses, then scores schedules according to the selected preset. Pins are hard constraints. The cart copies CRNs and opens MyUSF for the student to complete enrollment. The registration checklist is manual.

To supply actual section data, configure VITE_API_URL in .env.local and serve GET /courses?term=202701 with CORS enabled for the frontend origin. The response is an object with term set to "202701" and a sections array. Each section uses the Section fields defined in planner.ts, excluding sample. Use weekdays numbered 0–4, empty days for asynchronous classes, and integer minutes from midnight for start and end. CRNs must be unique five-digit strings. The provider supplies RMP and Coursicle metrics and seat availability. An empty valid array means no sections are available. When the feed is unavailable, the UI labels the sample fallback. Imported courses use simulated sections.

Plans are stored by major on the current browser under planabull_state_v1. A previously saved list under planabull-plan is imported on first use.

## DegreeWorks audits

In Degree plan, choose **Import audit PDF** and select a text-based DegreeWorks audit. Review the extracted “Still needed:” requirements, correct or exclude rows, and apply the result to the selected major. Alternative courses and credit requirements retain their audit wording. Choose individual courses to add to the semester schedule. This is a snapshot of the reviewed audit; importing a newer audit replaces the previous requirement list.

PDF.js reads the file locally. The PDF and full extracted text stay out of local storage. Image-only scans require a selectable-text export; status icons alone are not interpreted.
