from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import database, crud

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])

@router.get("/{user_id}")
def get_user_portfolio(user_id: int, db: Session = Depends(database.SessionLocal)):
    return crud.get_portfolio(db, user_id)
