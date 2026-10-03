import os
import re
import base64
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pdfplumber
import pytesseract
import google.generativeai as genai

router = APIRouter()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_REPO_OWNER = os.getenv("GITHUB_REPO_OWNER")
GITHUB_REPO_NAME = os.getenv("GITHUB_REPO_NAME")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

genai.configure(api_key=GEMINI_API_KEY)

class ExtractPDFRequest(BaseModel):
    github_path: str
    github_token: str
    filename: str


@router.post("/")
def extract_pdf(body: ExtractPDFRequest):
    temp_path = f"/tmp/{body.filename}"

    try:
        url = f"https://api.github.com/repos/{GITHUB_REPO_OWNER}/{GITHUB_REPO_NAME}/contents/{body.github_path}"
        headers = {
            "Authorization": f"Bearer {body.github_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        resp = requests.get(url, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        content_b64 = data.get("content", "")
        file_bytes = base64.b64decode(content_b64.replace("\n", ""))

        with open(temp_path, "wb") as f:
            f.write(file_bytes)

        extracted_text = ""
        with pdfplumber.open(temp_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"

        if len(extracted_text.strip()) < 50:
            extracted_text = ""
            with pdfplumber.open(temp_path) as pdf:
                for page in pdf.pages:
                    img = page.to_image(resolution=150).original
                    ocr_text = pytesseract.image_to_string(img)
                    extracted_text += ocr_text + "\n"

        cleaned_text = re.sub(r"\s+", " ", extracted_text).strip()
        truncated = cleaned_text[:3000]

        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = (
            "Extract structured project information from this academic document text. "
            "Return ONLY a valid JSON object with no markdown formatting. Fields: "
            "title (string), description (string), objectives (array of strings), "
            "features (array of strings), technologies (array of strings), keywords (array of strings).\n\n"
            f"Document text:\n{truncated}"
        )

        response = model.generate_content(prompt)
        response_text = response.text or ""
        cleaned = response_text.replace("```json", "").replace("```", "").strip()
        parsed = eval(cleaned) if cleaned.startswith("{") else {}

        return parsed

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
