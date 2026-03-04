from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=True)  # Nullable for Google OAuth users
    google_id = Column(String, unique=True, nullable=True, index=True)  # Google OAuth ID

    trades = relationship("Trade", back_populates="user")


class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    symbol = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    trade_type = Column(String, nullable=False)  # "buy" or "sell"
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="trades")
