from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import database, crud

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])

@router.get("/")
def get_leaderboard(db: Session = Depends(database.SessionLocal)):
    return crud.get_leaderboard(db)

