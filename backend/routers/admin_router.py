import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import firebase_admin
from firebase_admin import auth, firestore

router = APIRouter()

db = firestore.client()


class CreateUserRequest(BaseModel):
    email: str
    password: str
    name: str
    role: str


@router.post("/create-user")
def create_user(body: CreateUserRequest):
    try:
        user = auth.create_user(
            email=body.email,
            password=body.password,
            display_name=body.name,
        )
        db.collection("users").document(user.uid).set({
            "uid": user.uid,
            "email": body.email,
            "name": body.name,
            "role": body.role,
            "status": "active",
            "createdAt": firestore.SERVER_TIMESTAMP,
        })
        return {"uid": user.uid, "email": body.email}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete-user/{uid}")
def delete_user(uid: str):
    try:
        auth.delete_user(uid)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
