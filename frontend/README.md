# PlanABull

A USF registration planner built with React, TypeScript, and Vite. Run `npm install` and `npm run dev` to open the frontend. Use `npm test` for the Vitest suite and `npm run build` for a production bundle.

## Curriculum

The major picker uses a bundled USF undergraduate catalog. Each major opens its own course list, schedule, and saved audit. Semester numbers and credits come from readable named course rows in the published four-year sequence when available. Other curriculum options are listed without a semester and use estimated credits. Consult the linked curriculum for prerequisites, alternatives, and variable credit amounts. Refresh the additional major snapshots using `python frontend/scripts/refresh-majors.py` from the repository root with PyMuPDF installed.

To refresh the snapshot, run `node scripts/refresh-catalog.mjs` with Poppler's pdftotext on PATH, or set PDFTOTEXT to its executable. The script reads the public USF catalog widget, the four-year plans linked from each curriculum, and official course-credit fields.

## Sections and registration

Spring 2027 uses a dated snapshot from the [USF Staff Schedule Search](https://usfweb.usf.edu/DSS/StaffScheduleSearch). Refresh it from the repository root with `python frontend/scripts/refresh-sections.py`. It includes active sections with a single schedulable weekday meeting pattern in subjects represented in the catalog. Confirm current seats in MyUSF before registration.

The default app reads the bundled snapshot. Configuring VITE_API_URL loads the section feed from GET /courses?term=202701 instead. Verified Rate My Professors profile snapshots are matched by instructor and course in SectionFeed.ts. Other instructors remain unrated.

Plans are stored by major on the current browser under planabull_state_v1. A previously saved list under planabull-plan is imported on first use.

## DegreeWorks audits

In Degree plan, choose **Import audit PDF** and select a text-based DegreeWorks audit. Review the extracted “Still needed:” requirements, correct or exclude rows, and apply the result to the selected major. Alternative courses and credit requirements retain their audit wording. Choose individual courses to add to the semester schedule. This is a snapshot of the reviewed audit; importing a newer audit replaces the previous requirement list.

PDF.js reads the file locally. The PDF and full extracted text stay out of local storage. Image-only scans require a selectable-text export; status icons alone are not interpreted.
