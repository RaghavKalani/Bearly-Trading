import yfinance as yf

def get_stock_price(symbol: str) -> float:
    stock = yf.Ticker(symbol)
    hist = stock.history(period="1d")
    if not hist.empty:
        return hist["Close"].iloc[-1]
    else:
        return 0.0
