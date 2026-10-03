import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials
from dotenv import load_dotenv

from routers import pdf_router, similarity_router, roadmap_router, admin_router

load_dotenv()

FIREBASE_SERVICE_ACCOUNT_PATH = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "./serviceAccountKey.json")

if os.path.exists(FIREBASE_SERVICE_ACCOUNT_PATH):
    cred = credentials.Certificate(FIREBASE_SERVICE_ACCOUNT_PATH)
    firebase_admin.initialize_app(cred)
else:
    firebase_admin.initialize_app()

app = FastAPI(title="FYP Portal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pdf_router.router, prefix="/extract-pdf", tags=["PDF"])
app.include_router(similarity_router.router, prefix="/check-similarity", tags=["Similarity"])
app.include_router(roadmap_router.router, prefix="/generate-roadmap", tags=["Roadmap"])
app.include_router(admin_router.router, prefix="/admin", tags=["Admin"])

@app.get("/health")
def health_check():
    return {"status": "ok"}
