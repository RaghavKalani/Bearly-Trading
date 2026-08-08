from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import database, schemas, crud

router = APIRouter(prefix="/trading", tags=["Trading"])

@router.post("/trade/{user_id}")
def trade(user_id: int, trade: schemas.TradeCreate, db: Session = Depends(database.SessionLocal)):
    try:
        return crud.execute_trade(db, user_id, trade)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/history/{user_id}")
def get_trade_history(user_id: int, db: Session = Depends(database.SessionLocal)):
    return crud.get_trade_history(db, user_id)