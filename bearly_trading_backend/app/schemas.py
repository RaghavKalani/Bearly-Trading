from pydantic import BaseModel
from typing import List, Optional

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

class TradeCreate(BaseModel):
    symbol: str
    quantity: int
    trade_type: str  

class PortfolioItem(BaseModel):
    symbol: str
    quantity: int
    current_price: float
    total_value: float

class LeaderboardEntry(BaseModel):
    username: str
    net_worth: float
