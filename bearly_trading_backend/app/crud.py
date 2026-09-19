from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models, schemas
from app.utils.stock_data import get_stock_price, get_multiple_stock_prices
from passlib.context import CryptContext
from fastapi import HTTPException, status
from datetime import datetime, timedelta
from typing import List, Optional, Dict

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# User management & Security Auth helpers

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_google_id(db: Session, google_id: str):
    return db.query(models.User).filter(models.User.google_id == google_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        cash_balance=100000.0,  # Explicitly set initial cash balance
        email_verified=False
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Log audit event
    log_action(db, db_user.id, "register", f"User registered: {user.username}")
    return db_user

def create_google_user(db: Session, email: str, username: str, google_id: str):
    db_user = models.User(
        username=username,
        email=email,
        google_id=google_id,
        hashed_password=None,
        cash_balance=100000.0,
        email_verified=True  # Google emails are pre-verified
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Log audit event
    log_action(db, db_user.id, "register_google", f"User registered via Google OAuth: {username}")
    return db_user

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def increment_login_attempts(db: Session, user: models.User):
    user.login_attempts += 1
    if user.login_attempts >= 5:
        user.is_locked = True
        user.lockout_until = datetime.utcnow() + timedelta(minutes=15)
        log_action(db, user.id, "account_locked", "User account locked due to too many failed login attempts")
    db.commit()
    db.refresh(user)

def reset_login_attempts(db: Session, user: models.User):
    user.login_attempts = 0
    user.is_locked = False
    user.lockout_until = None
    db.commit()
    db.refresh(user)

def verify_user(db: Session, email: str, password: str) -> Optional[models.User]:
    user = get_user_by_email(db, email)
    if not user:
        return None

    # Handle Lockout Checks
    if user.is_locked:
        if user.lockout_until and user.lockout_until > datetime.utcnow():
            return user  # Caller handles raising the 403 error for locked state
        else:
            # Lockout expired, unlock
            user.is_locked = False
            user.login_attempts = 0
            user.lockout_until = None
            db.commit()

    if user.hashed_password and verify_password(password, user.hashed_password):
        reset_login_attempts(db, user)
        log_action(db, user.id, "login_success", "User successfully logged in")
        return user
    else:
        increment_login_attempts(db, user)
        return None


# Trading logic

def execute_trade(db: Session, user_id: int, trade: schemas.TradeCreate) -> models.Trade:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    symbol = trade.symbol.upper().strip()
    price = get_stock_price(symbol)
    if price <= 0:
        raise HTTPException(status_code=400, detail=f"Stock symbol {symbol} not found or has invalid price")

    quantity = trade.quantity
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than zero")

    trade_type = trade.trade_type.lower()
    total_cost = price * quantity

    if trade_type == "buy":
        # Financial validation
        if user.cash_balance < total_cost:
            raise HTTPException(status_code=400, detail=f"Insufficient funds. Required: ${total_cost:,.2f}, Available: ${user.cash_balance:,.2f}")
        
        # Deduct cash
        user.cash_balance -= total_cost
        new_trade = models.Trade(
            user_id=user_id,
            symbol=symbol,
            quantity=quantity,
            price=price,
            trade_type="buy"
        )
        db.add(new_trade)
        db.commit()
        db.refresh(new_trade)
        log_action(db, user_id, "trade_buy", f"Bought {quantity} shares of {symbol} at ${price:.2f} each. Total: ${total_cost:.2f}")
        return new_trade

    elif trade_type == "sell":
        # Check holdings
        holdings = get_user_holdings_dict(db, user_id)
        owned_quantity = holdings.get(symbol, 0)

        if quantity > owned_quantity:
            raise HTTPException(status_code=400, detail=f"Not enough shares to sell. Attempted: {quantity}, Owned: {owned_quantity}")

        # Add cash
        user.cash_balance += total_cost
        new_trade = models.Trade(
            user_id=user_id,
            symbol=symbol,
            quantity=quantity,
            price=price,
            trade_type="sell"
        )
        db.add(new_trade)
        db.commit()
        db.refresh(new_trade)
        log_action(db, user_id, "trade_sell", f"Sold {quantity} shares of {symbol} at ${price:.2f} each. Total: ${total_cost:.2f}")
        return new_trade

    else:
        raise HTTPException(status_code=400, detail="Invalid trade type. Must be 'buy' or 'sell'")


def get_user_holdings_dict(db: Session, user_id: int) -> Dict[str, int]:
    """Calculate net share balance for each symbol held by the user"""
    trades = db.query(models.Trade).filter(models.Trade.user_id == user_id).all()
    holdings = {}
    for t in trades:
        sym = t.symbol.upper()
        if t.trade_type == "buy":
            holdings[sym] = holdings.get(sym, 0) + t.quantity
        elif t.trade_type == "sell":
            holdings[sym] = holdings.get(sym, 0) - t.quantity
    
    # Keep only positive holdings
    return {k: v for k, v in holdings.items() if v > 0}


def get_portfolio(db: Session, user_id: int) -> List[schemas.PortfolioItem]:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    trades = db.query(models.Trade).filter(models.Trade.user_id == user_id).order_by(models.Trade.timestamp.asc()).all()
    
    # Calculate share quantities and average purchase prices (cost basis)
    holdings_data = {}  # {symbol: {"qty": X, "avg_price": Y}}
    
    for t in trades:
        sym = t.symbol.upper()
        if sym not in holdings_data:
            holdings_data[sym] = {"qty": 0, "avg_price": 0.0}

        curr_qty = holdings_data[sym]["qty"]
        curr_avg = holdings_data[sym]["avg_price"]

        if t.trade_type == "buy":
            new_qty = curr_qty + t.quantity
            new_avg = ((curr_qty * curr_avg) + (t.quantity * t.price)) / new_qty if new_qty > 0 else 0.0
            holdings_data[sym] = {"qty": new_qty, "avg_price": new_avg}
        elif t.trade_type == "sell":
            new_qty = max(0, curr_qty - t.quantity)
            if new_qty == 0:
                holdings_data[sym] = {"qty": 0, "avg_price": 0.0}
            else:
                # Average cost basis remains unchanged on sell orders
                holdings_data[sym]["qty"] = new_qty

    # Filter out completed holdings
    active_holdings = {k: v for k, v in holdings_data.items() if v["qty"] > 0}
    
    if not active_holdings:
        return []

    # Batch fetch prices for active symbols
    symbols = list(active_holdings.keys())
    prices = get_multiple_stock_prices(symbols)

    result = []
    for sym, details in active_holdings.items():
        qty = details["qty"]
        avg_cost = details["avg_price"]
        current_price = prices.get(sym, 0.0)
        
        if current_price == 0.0:
            current_price = avg_cost  # Fallback to cost basis if price fails

        total_value = qty * current_price
        total_cost = qty * avg_cost
        gain_loss = total_value - total_cost
        gain_loss_percent = (gain_loss / total_cost) * 100 if total_cost > 0 else 0.0

        # Create a dynamic mock-schema matching frontend expectation
        result.append({
            "symbol": sym,
            "quantity": qty,
            "avgPrice": avg_cost,
            "currentPrice": current_price,
            "totalValue": total_value,
            "gainLoss": gain_loss,
            "gainLossPercent": gain_loss_percent
        })
    return result


def get_leaderboard(db: Session) -> List[dict]:
    """Optimized leaderboard fetching with batched Stock Data requests"""
    users = db.query(models.User).all()
    if not users:
        return []

    # Get all distinct symbols across the platform trades
    distinct_symbols_query = db.query(models.Trade.symbol).distinct().all()
    all_symbols = [s[0].upper() for s in distinct_symbols_query if s[0]]

    # Batch fetch all prices at once
    prices = get_multiple_stock_prices(all_symbols)

    leaderboard = []
    for user in users:
        # Calculate holdings for this user
        holdings = get_user_holdings_dict(db, user.id)
        
        # Calculate holdings value
        holdings_val = sum(qty * prices.get(sym, 0.0) for sym, qty in holdings.items())
        net_worth = user.cash_balance + holdings_val

        leaderboard.append({
            "username": user.username,
            "net_worth": net_worth,
            "cash_balance": user.cash_balance,
            "holdings_value": holdings_val
        })

    # Sort descending
    return sorted(leaderboard, key=lambda x: x["net_worth"], reverse=True)


# Watchlist Management

def get_watchlist(db: Session, user_id: int) -> List[str]:
    items = db.query(models.WatchlistItem).filter(models.WatchlistItem.user_id == user_id).all()
    return [item.symbol for item in items]

def add_to_watchlist(db: Session, user_id: int, symbol: str) -> models.WatchlistItem:
    sym = symbol.upper().strip()
    existing = db.query(models.WatchlistItem).filter_by(user_id=user_id, symbol=sym).first()
    if existing:
        return existing
    
    item = models.WatchlistItem(user_id=user_id, symbol=sym)
    db.add(item)
    db.commit()
    db.refresh(item)
    log_action(db, user_id, "watchlist_add", f"Added {sym} to watchlist")
    return item

def remove_from_watchlist(db: Session, user_id: int, symbol: str):
    sym = symbol.upper().strip()
    item = db.query(models.WatchlistItem).filter_by(user_id=user_id, symbol=sym).first()
    if item:
        db.delete(item)
        db.commit()
        log_action(db, user_id, "watchlist_remove", f"Removed {sym} from watchlist")
        return True
    return False


# Audit Logging

def log_action(db: Session, user_id: Optional[int], action: str, details: str = None, ip_address: str = None):
    audit = models.AuditLog(
        user_id=user_id,
        action=action,
        details=details,
        ip_address=ip_address
    )
    db.add(audit)
    db.commit()


# Compliance & Data Management

def export_user_data(db: Session, user_id: int) -> dict:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    trades = db.query(models.Trade).filter(models.Trade.user_id == user_id).all()
    watchlist = db.query(models.WatchlistItem).filter(models.WatchlistItem.user_id == user_id).all()
    audit_logs = db.query(models.AuditLog).filter(models.AuditLog.user_id == user_id).all()

    return {
        "profile": {
            "username": user.username,
            "email": user.email,
            "cash_balance": user.cash_balance,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "email_verified": user.email_verified
        },
        "trades": [
            {
                "symbol": t.symbol,
                "quantity": t.quantity,
                "price": t.price,
                "trade_type": t.trade_type,
                "timestamp": t.timestamp.isoformat() if t.timestamp else None
            } for t in trades
        ],
        "watchlist": [item.symbol for item in watchlist],
        "audit_logs": [
            {
                "action": log.action,
                "details": log.details,
                "timestamp": log.timestamp.isoformat() if log.timestamp else None
            } for log in audit_logs
        ]
    }

def delete_user_account(db: Session, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Cascade deletes will automatically remove trades, watchlists, audit logs, refresh tokens.
    db.delete(user)
    db.commit()
