from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import database, schemas, crud, auth, models
from app.utils.stock_data import get_stock_price

router = APIRouter(prefix="/trading", tags=["Trading"])

@router.post("/trade", response_model=schemas.TradeResponse)
def trade(
    trade: schemas.TradeCreate, 
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    try:
        return crud.execute_trade(db, current_user.id, trade)
    except Exception as e:
        detail = str(e.detail) if hasattr(e, 'detail') else str(e)
        raise HTTPException(status_code=400, detail=detail)

@router.get("/price/{symbol}")
def get_price(symbol: str):
    price = get_stock_price(symbol)
    if price <= 0:
        raise HTTPException(status_code=404, detail=f"Symbol {symbol.upper()} not found or has invalid price.")
    return {"symbol": symbol.upper(), "price": price}

@router.get("/history")
def get_trade_history(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    trades = db.query(models.Trade).filter(
        models.Trade.user_id == current_user.id
    ).order_by(models.Trade.timestamp.desc()).all()
    
    return [
        {
            "id": t.id,
            "symbol": t.symbol,
            "quantity": t.quantity,
            "price": t.price,
            "trade_type": t.trade_type,
            "timestamp": t.timestamp.isoformat()
        } for t in trades
    ]