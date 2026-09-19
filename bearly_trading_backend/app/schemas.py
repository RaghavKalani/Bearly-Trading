from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class TokenData(BaseModel):
    email: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class GoogleLogin(BaseModel):
    credential: str  # Google OAuth token

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    email: str

class PasswordResetRequest(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    email: str
    new_password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    cash_balance: float
    email_verified: bool
    is_locked: bool
    created_at: datetime

    class Config:
        from_attributes = True

class TradeCreate(BaseModel):
    symbol: str
    quantity: int
    trade_type: str  

class TradeResponse(BaseModel):
    id: int
    symbol: str
    quantity: int
    price: float
    trade_type: str
    timestamp: datetime

    class Config:
        from_attributes = True

class PortfolioItem(BaseModel):
    symbol: str
    quantity: int
    avgPrice: float
    currentPrice: float
    totalValue: float
    gainLoss: float
    gainLossPercent: float

class LeaderboardEntry(BaseModel):
    username: str
    net_worth: float
    cash_balance: float
    holdings_value: float

class WatchlistAdd(BaseModel):
    symbol: str

