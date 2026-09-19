from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import database, crud, auth, models, schemas

router = APIRouter(prefix="/watchlist", tags=["Watchlist"])

@router.get("/")
def get_watchlist(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    return crud.get_watchlist(db, current_user.id)

@router.post("/add")
def add_to_watchlist(
    body: schemas.WatchlistAdd,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    crud.add_to_watchlist(db, current_user.id, body.symbol)
    return {"message": f"Successfully added {body.symbol.upper()} to watchlist"}

@router.delete("/remove/{symbol}")
def remove_from_watchlist(
    symbol: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    removed = crud.remove_from_watchlist(db, current_user.id, symbol)
    if not removed:
        raise HTTPException(status_code=404, detail=f"Symbol {symbol.upper()} not found in watchlist")
    return {"message": f"Successfully removed {symbol.upper()} from watchlist"}
