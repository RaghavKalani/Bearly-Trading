import React, { useState } from 'react';
import { trading } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TradeHistory from './TradeHistory';

const Trading = () => {
  const { user } = useAuth();
  const [orderData, setOrderData] = useState({
    symbol: '',
    quantity: '',
    orderType: 'market',
    side: 'buy'
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Mocking the trading.executeTrade function
      console.log("Mock trade executed:", { userId: user.id, ...orderData });
      setOrderData({ ...orderData, quantity: '' });
      // Could add success message or refresh trade history here
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-6">Place Order</h1>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg">
          <div className="space-y-4">
            <div>
              <label className="text-white block mb-2">Symbol</label>
              <input
                type="text"
                value={orderData.symbol}
                onChange={(e) => setOrderData({...orderData, symbol: e.target.value.toUpperCase()})}
                className="w-full p-2 rounded bg-gray-700 text-white"
                required
              />
            </div>
            <div>
              <label className="text-white block mb-2">Quantity</label>
              <input
                type="number"
                value={orderData.quantity}
                onChange={(e) => setOrderData({...orderData, quantity: e.target.value})}
                className="w-full p-2 rounded bg-gray-700 text-white"
                min="1"
                required
              />
            </div>
            <div>
              <label className="text-white block mb-2">Order Type</label>
              <select
                value={orderData.orderType}
                onChange={(e) => setOrderData({...orderData, orderType: e.target.value})}
                className="w-full p-2 rounded bg-gray-700 text-white"
              >
                <option value="market">Market</option>
                <option value="limit">Limit</option>
              </select>
            </div>
            <div>
              <label className="text-white block mb-2">Side</label>
              <select
                value={orderData.side}
                onChange={(e) => setOrderData({...orderData, side: e.target.value})}
                className="w-full p-2 rounded bg-gray-700 text-white"
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Place Order
            </button>
          </div>
        </form>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Trade History</h2>
        <div className="bg-gray-800 rounded-lg">
          <TradeHistory symbol={orderData.symbol || 'AAPL'} />
        </div>
      </div>
    </div>
  );
};

export default Trading;