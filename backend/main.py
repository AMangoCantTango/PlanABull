from fastapi import FastAPI, HTTPException
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
import json

app = FastAPI(title="PlanABull API",
              description ="Academic Planning for USF students",
              version="0.1.0")


BASE_DIR = Path(__file__).resolve().parent

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8501",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {
        "status": "running",
        "app": "PlanABull",
        "message": "Backend is working!"
    }


@app.get("/courses")
def get_courses(term: str | None = None):
    if term is not None:
        if term != "202701":
            raise HTTPException(404, "No published schedule snapshot for this term")
        return json.loads((BASE_DIR.parent / "public" / "usf-sections.json").read_text(encoding="utf-8"))

    file_path = BASE_DIR / "courses.json"

    try:
        with open(file_path, "r", encoding="utf-8") as file:
            courses = json.load(file)

        return {"courses": courses}

    except FileNotFoundError:
        raise HTTPException(
            status_code=500,
            detail="courses.json file not found"
        )

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="Invalid JSON in courses.json"
        )
