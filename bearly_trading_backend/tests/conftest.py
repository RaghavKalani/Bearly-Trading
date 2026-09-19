import pytest
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app import models
from app.main import app
from fastapi.testclient import TestClient

# SQLite temporary file database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_temp.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    # Remove any stray test database files
    if os.path.exists("./test_temp.db"):
        try:
            os.remove("./test_temp.db")
        except Exception:
            pass

    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
        if os.path.exists("./test_temp.db"):
            try:
                os.remove("./test_temp.db")
            except Exception:
                pass

@pytest.fixture(scope="function")
def client(db_session, monkeypatch):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    # Mock yfinance price fetch functions in crud and stock_data modules
    def mock_get_stock_price(symbol: str) -> float:
        sym = symbol.upper().strip()
        if sym == "AAPL":
            return 150.0
        elif sym == "MSFT":
            return 300.0
        elif sym == "INVALID":
            return 0.0
        return 100.0

    def mock_get_multiple_stock_prices(symbols):
        res = {}
        for s in symbols:
            sym = s.upper().strip()
            if sym == "AAPL":
                res[sym] = 150.0
            elif sym == "MSFT":
                res[sym] = 300.0
            else:
                res[sym] = 100.0
        return res

    monkeypatch.setattr("app.crud.get_stock_price", mock_get_stock_price)
    monkeypatch.setattr("app.crud.get_multiple_stock_prices", mock_get_multiple_stock_prices)
    monkeypatch.setattr("app.utils.stock_data.get_stock_price", mock_get_stock_price)
    monkeypatch.setattr("app.utils.stock_data.get_multiple_stock_prices", mock_get_multiple_stock_prices)
    
    # Mock yfinance library itself to prevent any test runner network side effects
    class MockTicker:
        def __init__(self, ticker):
            self.ticker = ticker
        def history(self, *args, **kwargs):
            import pandas as pd
            if self.ticker == "INVALID":
                return pd.DataFrame()
            return pd.DataFrame({"Close": [150.0]})

    monkeypatch.setattr("yfinance.Ticker", MockTicker)

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()
