import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai

router = APIRouter()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)


class RoadmapRequest(BaseModel):
    student_skills: list[str]
    project_technologies: list[str]
    experience_level: str


@router.post("/")
def generate_roadmap(body: RoadmapRequest):
    try:
        gap = [t for t in body.project_technologies if t not in body.student_skills]

        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = (
            f"Create a learning roadmap for a student with experience level: {body.experience_level}.\n"
            f"Current skills: {', '.join(body.student_skills)}\n"
            f"Project requires: {', '.join(body.project_technologies)}\n"
            f"Gap technologies: {', '.join(gap)}\n\n"
            "Return ONLY valid JSON with no markdown. Format: "
            "phases array where each phase has name (string), duration (string), "
            "topics array of strings, resources array of strings."
        )

        response = model.generate_content(prompt)
        text = response.text or ""
        cleaned = text.replace("```json", "").replace("```", "").strip()
        parsed = eval(cleaned) if cleaned.startswith("{") else {}

        return parsed
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
