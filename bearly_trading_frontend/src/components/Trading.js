import React, { useState, useEffect } from 'react';
import { trading } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TradeHistory from './TradeHistory';
import { DollarSign, RefreshCw, ShoppingCart, Percent } from 'lucide-react';

const Trading = () => {
  const { user, refreshUserObj } = useAuth();
  
  const [order, setOrder] = useState({
    symbol: '',
    quantity: '',
    tradeType: 'buy',
  });

  const [stockPrice, setStockPrice] = useState(null);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [priceError, setPriceError] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refreshHistory, setRefreshHistory] = useState(0);

  // Fetch price when symbol changes
  useEffect(() => {
    const sym = order.symbol.trim().toUpperCase();
    if (!sym) {
      setStockPrice(null);
      setPriceError('');
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setFetchingPrice(true);
      setPriceError('');
      try {
        const response = await trading.getPrice(sym);
        setStockPrice(response.data.price);
      } catch (err) {
        setStockPrice(null);
        setPriceError('Symbol not found or pricing unavailable');
      } finally {
        setFetchingPrice(false);
      }
    }, 600); // 600ms debounce

    return () => clearTimeout(delayDebounce);
  }, [order.symbol]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const qty = parseInt(order.quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Quantity must be a positive integer.');
      return;
    }

    if (!stockPrice) {
      setError('Ticker symbol price is invalid or unavailable.');
      return;
    }

    setSubmitting(true);
    try {
      await trading.executeTrade({
        symbol: order.symbol.trim().toUpperCase(),
        quantity: qty,
        trade_type: order.tradeType,
      });

      setSuccess(`Successfully executed ${order.tradeType.toUpperCase()} order for ${qty} shares of ${order.symbol.toUpperCase()}!`);
      setOrder({ symbol: '', quantity: '', tradeType: 'buy' });
      setStockPrice(null);

      // Sync User Object (cash balance) and refresh history
      await refreshUserObj();
      setRefreshHistory(prev => prev + 1);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit order. Check cash limits/holdings.');
    } finally {
      setSubmitting(false);
    }
  };

  const estimatedTotal = stockPrice && order.quantity ? stockPrice * parseInt(order.quantity) : 0;
  const formatCurrency = (val) => val.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-white font-sans bg-gray-950 min-h-screen">
      
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Order Execution Desk</h1>
        <p className="text-gray-400 mt-1">Execute virtual simulated trades using live market pricing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Form Panel */}
        <div className="lg:col-span-5 bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl space-y-6">
          <div className="border-b border-gray-850 pb-4">
            <h3 className="text-lg font-bold">New Market Order</h3>
            <p className="text-xs text-gray-500 mt-1">Available Cash: <span className="text-green-400 font-extrabold">{formatCurrency(user?.cashBalance || 0)}</span></p>
          </div>

          {error && <div className="text-xs text-red-400 bg-red-950/40 border border-red-900 p-3 rounded-xl">⚠️ {error}</div>}
          {success && <div className="text-xs text-green-400 bg-green-950/40 border border-green-900 p-3 rounded-xl">✅ {success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOrder({ ...order, tradeType: 'buy' })}
                className={`py-3 px-4 rounded-xl font-extrabold tracking-wider border transition-all ${
                  order.tradeType === 'buy'
                    ? 'bg-green-600/35 border-green-500 text-green-300'
                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                BUY / LONG
              </button>
              <button
                type="button"
                onClick={() => setOrder({ ...order, tradeType: 'sell' })}
                className={`py-3 px-4 rounded-xl font-extrabold tracking-wider border transition-all ${
                  order.tradeType === 'sell'
                    ? 'bg-red-600/35 border-red-500 text-red-300'
                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                SELL / SHORT
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Stock Ticker Symbol</label>
              <div className="relative">
                <input
                  type="text"
                  value={order.symbol}
                  onChange={(e) => setOrder({ ...order, symbol: e.target.value.toUpperCase() })}
                  className="w-full p-3 rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-650 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="AAPL, TSLA, NVDA"
                  required
                />
                {fetchingPrice && (
                  <div className="absolute right-3 top-3.5">
                    <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                  </div>
                )}
              </div>
              {priceError && <p className="text-xs text-red-400 mt-1.5">❌ {priceError}</p>}
              {stockPrice && (
                <div className="mt-2 flex justify-between items-center text-xs bg-gray-950 border border-gray-850 p-2.5 rounded-lg">
                  <span className="text-gray-400 font-medium">Estimated Share Price:</span>
                  <span className="text-white font-extrabold">{formatCurrency(stockPrice)}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Quantity of Shares</label>
              <input
                type="number"
                value={order.quantity}
                onChange={(e) => setOrder({ ...order, quantity: e.target.value })}
                className="w-full p-3 rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-650 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="0"
                min="1"
                required
              />
            </div>

            {/* Price Preview Panel */}
            {estimatedTotal > 0 && (
              <div className="bg-gray-950 border border-gray-850 p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(estimatedTotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 border-b border-gray-850 pb-2">
                  <span>Commission / Fees:</span>
                  <span className="text-green-400 font-semibold">FREE ($0.00)</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm pt-1">
                  <span>Estimated Total cost:</span>
                  <span className="text-blue-400">{formatCurrency(estimatedTotal)}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || fetchingPrice || !stockPrice}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-650 hover:from-blue-500 hover:to-purple-550 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-30 flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              {submitting ? 'Transmitting order...' : `Submit Market ${order.tradeType.toUpperCase()}`}
            </button>
          </form>
        </div>

        {/* History Panel */}
        <div className="lg:col-span-7 h-full">
          <TradeHistory refreshTrigger={refreshHistory} />
        </div>

      </div>

    </div>
  );
};

export default Trading;