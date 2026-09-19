import yfinance as yf
import time
from typing import List, Dict

_price_cache = {}  # {symbol: (price, timestamp)}
CACHE_EXPIRE_SECONDS = 300  # 5 minutes

def get_stock_price(symbol: str) -> float:
    symbol = symbol.upper().strip()
    now = time.time()
    
    # Check cache
    if symbol in _price_cache:
        price, ts = _price_cache[symbol]
        if now - ts < CACHE_EXPIRE_SECONDS:
            return price

    try:
        stock = yf.Ticker(symbol)
        hist = stock.history(period="1d")
        if not hist.empty:
            price = float(hist["Close"].iloc[-1])
            _price_cache[symbol] = (price, now)
            return price
    except Exception as e:
        print(f"Error fetching stock price for {symbol}: {e}")

    # Fallback to expired cache if fetch fails
    if symbol in _price_cache:
        return _price_cache[symbol][0]
    return 0.0

def get_multiple_stock_prices(symbols: List[str]) -> Dict[str, float]:
    """Fetch prices for a list of symbols in batch, using cache when available"""
    unique_symbols = list(set([s.upper().strip() for s in symbols if s]))
    if not unique_symbols:
        return {}

    now = time.time()
    prices = {}
    missing_symbols = []

    # Check cache
    for sym in unique_symbols:
        if sym in _price_cache:
            price, ts = _price_cache[sym]
            if now - ts < CACHE_EXPIRE_SECONDS:
                prices[sym] = price
                continue
        missing_symbols.append(sym)

    # Fetch missing symbols in batch
    if missing_symbols:
        try:
            # yf.download is optimal for fetching multiple tickers at once
            tickers_str = " ".join(missing_symbols)
            data = yf.download(tickers_str, period="1d", group_by="ticker", progress=False)
            
            for sym in missing_symbols:
                try:
                    if len(missing_symbols) == 1:
                        # yfinance output structure changes for single ticker
                        close_col = data["Close"]
                    else:
                        close_col = data[sym]["Close"]
                    
                    price = float(close_col.iloc[-1])
                    _price_cache[sym] = (price, now)
                    prices[sym] = price
                except Exception:
                    # Fallback to single fetch if format parsing failed
                    prices[sym] = get_stock_price(sym)
        except Exception as e:
            print(f"Error in batch fetching: {e}. Falling back to single fetch.")
            for sym in missing_symbols:
                prices[sym] = get_stock_price(sym)

    return prices

