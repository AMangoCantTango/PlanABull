# PlanABull

A USF course planning prototype with a React frontend and a FastAPI backend. The backend serves a sample course catalog with section times and seat counts. Plans are saved in the browser.

## Run locally

From the repository root, install and start the backend with Python:

```sh
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --reload
```

In another terminal, use Node.js 20.19+ or 22.12+:

```sh
cd frontend
npm ci
npm run dev
```

Open the URL printed by Vite. The frontend fetches courses from `http://127.0.0.1:8000/courses`. To use a different API address, copy `frontend/.env.example` to `frontend/.env.local`, set `VITE_API_URL`, and restart Vite. The API also exposes `/health` and interactive documentation at `/docs`.

Run `npm run build` from `frontend` to build the app, or `npm run preview` to preview that build locally.

The catalog, degree requirements, and availability are illustrative. PlanABull does not submit enrollments to USF.
