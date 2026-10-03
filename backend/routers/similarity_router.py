import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

router = APIRouter()

model = SentenceTransformer("all-MiniLM-L6-v2")


class ExistingProject(BaseModel):
    id: str
    title: str
    description: str
    features: list[str]
    technologies: list[str]


class SimilarityRequest(BaseModel):
    new_project: dict
    existing_projects: list[ExistingProject]


def build_text(project):
    parts = [
        project.get("title", ""),
        project.get("description", ""),
        " ".join(project.get("features", [])),
    ]
    return " ".join(parts)


@router.post("/")
def check_similarity(body: SimilarityRequest):
    new_text = build_text(body.new_project)
    existing_texts = [build_text(p.dict()) for p in body.existing_projects]

    all_texts = [new_text] + existing_texts
    embeddings = model.encode(all_texts)

    new_embedding = embeddings[0:1]
    existing_embeddings = embeddings[1:]

    similarities = cosine_similarity(new_embedding, existing_embeddings)[0]

    results = []
    for idx, proj in enumerate(body.existing_projects):
        score = float(similarities[idx])
        if score > 0.30:
            results.append({
                "projectId": proj.id,
                "title": proj.title,
                "similarityScore": round(score, 3),
            })

    results.sort(key=lambda x: x["similarityScore"], reverse=True)
    return results
