# PlanABull

A responsive frontend prototype for a USF student course planner, inspired by the supplied Spotify design reference.

## Run locally

Requires Node.js 20.19+ or 22.12+ and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Use `npm run build` for a production build, and `npm run preview` to preview it.

## Backend connection

Copy `.env.example` to `.env.local`, set `VITE_API_URL` to the backend's reachable address, and restart Vite. The default is `http://127.0.0.1:8000`.

`api.ts` exports `getCourses()` for `GET /courses` and `getHealth()` for `GET /health`. The backend must allow the frontend's origin through CORS. These helpers are ready to import, but the UI still uses sample courses until the backend response format is confirmed.

## Prototype features

- Overview, degree progress, course exploration, schedule, and saved-plan views.
- Search and category filters; adding/removing courses updates the weekly calendar and credit count.
- Schedule preferences and alternate sample combinations.
- Local-device plan saving and a downloadable sample plan.
- Responsive desktop/mobile layouts and keyboard focus states.

All courses, instructors, ratings, degree rules, and CRNs are illustrative. No live USF, Rate My Professors, or Coursicle integration is connected, and no enrollment is performed. Saved plans stay in this browser's local storage. Google Fonts is optional; system font fallbacks are included.

The prototype uses React, TypeScript, and Vite. The frontend can later move into Next.js when server rendering or application routes are needed. Course fixtures currently live in `App.tsx` and can be replaced with backend responses.

