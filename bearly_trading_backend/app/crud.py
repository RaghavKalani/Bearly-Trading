from sqlalchemy.orm import Session
from app import models, schemas
from passlib.context import CryptContext
from fastapi import HTTPException
import yfinance as yf

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_google_id(db: Session, google_id: str):
    return db.query(models.User).filter(models.User.google_id == google_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = models.User(username=user.username, email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_google_user(db: Session, email: str, username: str, google_id: str):
    """Create a new user from Google OAuth"""
    db_user = models.User(
        username=username,
        email=email,
        google_id=google_id,
        hashed_password=None  # Google OAuth users don't need a password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def verify_user(db: Session, email: str, password: str):
    """Verify user credentials for traditional login"""
    user = get_user_by_email(db, email)
    if user and user.hashed_password and verify_password(password, user.hashed_password):
        return user
    return None

def execute_trade(db: Session, user_id: int, trade: schemas.TradeCreate):
    stock = yf.Ticker(trade.symbol)
    price = stock.history(period="1d")["Close"].iloc[-1]

    if trade.trade_type.lower() == "buy":
        new_trade = models.Trade(user_id=user_id, symbol=trade.symbol, quantity=trade.quantity, price=price, trade_type="buy")
        db.add(new_trade)
    elif trade.trade_type.lower() == "sell":
        owned_quantity = db.query(models.Trade).filter_by(user_id=user_id, symbol=trade.symbol, trade_type="buy").with_entities(models.Trade.quantity).all()
        total_owned = sum([q[0] for q in owned_quantity]) - sum([
            t.quantity for t in db.query(models.Trade).filter_by(user_id=user_id, symbol=trade.symbol, trade_type="sell").all()
        ])
        if trade.quantity > total_owned:
            raise HTTPException(status_code=400, detail="Not enough shares to sell.")
        new_trade = models.Trade(user_id=user_id, symbol=trade.symbol, quantity=trade.quantity, price=price, trade_type="sell")
        db.add(new_trade)
    else:
        raise HTTPException(status_code=400, detail="Invalid trade type.")
    
    db.commit()
    return new_trade

def get_trade_history(db: Session, user_id: int):
    trades = (
        db.query(models.Trade)
        .filter(models.Trade.user_id == user_id)
        .order_by(models.Trade.timestamp.desc())
        .all()
    )
    return [
        {
            "id": trade.id,
            "symbol": trade.symbol,
            "side": trade.trade_type,
            "quantity": trade.quantity,
            "price": trade.price,
            "timestamp": trade.timestamp.isoformat(),
            "status": "completed",
        }
        for trade in trades
    ]


def get_portfolio(db: Session, user_id: int):
    portfolio = {}
    trades = db.query(models.Trade).filter(models.Trade.user_id == user_id).all()
    for trade in trades:
        if trade.symbol not in portfolio:
            portfolio[trade.symbol] = 0
        if trade.trade_type == "buy":
            portfolio[trade.symbol] += trade.quantity
        elif trade.trade_type == "sell":
            portfolio[trade.symbol] -= trade.quantity
    result = []
    for symbol, qty in portfolio.items():
        if qty > 0:
            price = yf.Ticker(symbol).history(period="1d")["Close"].iloc[-1]
            result.append(schemas.PortfolioItem(
                symbol=symbol,
                quantity=qty,
                current_price=price,
                total_value=qty * price
            ))
    return result

def get_leaderboard(db: Session):
    users = db.query(models.User).all()
    leaderboard = []
    for user in users:
        portfolio = get_portfolio(db, user.id)
        net_worth = sum([item.total_value for item in portfolio]) + 100000
        leaderboard.append({"username": user.username, "net_worth": net_worth})
    return sorted(leaderboard, key=lambda x: x["net_worth"], reverse=True)
