import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { trading } from '../services/api';

const TradeHistory = ({ symbol }) => {
  const { user } = useAuth();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTradeHistory = async () => {
      try {
        const userId = user?.id ?? user?.user_id;
        if (!userId) {
          setLoading(false);
          return;
        }

        const response = await trading.getTradeHistory(userId);
        const normalizedSymbol = (symbol || '').trim().toUpperCase();
        const fetchedTrades = (response.data || [])
          .filter((trade) => !normalizedSymbol || trade.symbol === normalizedSymbol)
          .map((trade) => ({
            id: trade.id,
            symbol: trade.symbol,
            side: trade.side,
            quantity: trade.quantity,
            price: trade.price,
            timestamp: trade.timestamp,
            status: trade.status || 'completed'
          }));

        setTrades(fetchedTrades);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch trade history:', err);
        setLoading(false);
      }
    };

    fetchTradeHistory();
  }, [user, symbol]);

  if (loading) {
    return <div className="text-white p-4">Loading trade history...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-gray-400 border-b border-gray-700">
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Symbol</th>
            <th className="px-4 py-3">Side</th>
            <th className="px-4 py-3">Qty</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr key={trade.id} className="text-white border-b border-gray-700 hover:bg-gray-700">
              <td className="px-4 py-3 text-sm">
                {new Date(trade.timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </td>
              <td className="px-4 py-3 font-bold">{trade.symbol}</td>
              <td className={`px-4 py-3 ${trade.side === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                {trade.side.toUpperCase()}
              </td>
              <td className="px-4 py-3">{trade.quantity}</td>
              <td className="px-4 py-3">${trade.price.toFixed(2)}</td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 text-xs rounded bg-green-900 text-green-300">
                  {trade.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {trades.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No trade history yet
        </div>
      )}
    </div>
  );
};

export default TradeHistory;
