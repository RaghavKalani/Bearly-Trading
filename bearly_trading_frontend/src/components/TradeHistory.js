import React, { useState, useEffect } from 'react';
import { trading } from '../services/api';
import { RefreshCw } from 'lucide-react';

const TradeHistory = ({ symbol, refreshTrigger }) => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTradeHistory = async () => {
    try {
      setError('');
      const response = await trading.getHistory();
      let data = response.data || [];
      
      // Optionally filter by symbol
      if (symbol) {
        data = data.filter(t => t.symbol.toUpperCase() === symbol.toUpperCase());
      }
      
      setTrades(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch trade history:', err);
      setError('Could not load transaction logs.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTradeHistory();
  }, [symbol, refreshTrigger]);

  if (loading) {
    return <div className="text-gray-400 p-4 text-center text-xs animate-pulse">Loading transaction logs...</div>;
  }

  if (error) {
    return <div className="text-red-400 p-4 text-center text-xs">⚠️ {error}</div>;
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
        <h3 className="font-bold text-white tracking-tight">Execution Audit Trail</h3>
        <button 
          onClick={fetchTradeHistory}
          className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-auto max-h-[350px] scrollbar-thin flex-1">
        {trades.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-800 bg-gray-950/40 sticky top-0 uppercase text-[10px] tracking-wider">
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Ticker</th>
                <th className="px-5 py-3">Side</th>
                <th className="px-5 py-3 text-right">Shares</th>
                <th className="px-5 py-3 text-right">Price</th>
                <th className="px-5 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-850">
              {trades.map((trade) => {
                const totalCost = trade.quantity * trade.price;
                const isBuy = trade.trade_type.toLowerCase() === 'buy';
                return (
                  <tr key={trade.id} className="text-gray-300 hover:bg-gray-850 transition-colors">
                    <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(trade.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-5 py-3.5 font-extrabold text-white tracking-wide">{trade.symbol}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-full ${
                        isBuy 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {trade.trade_type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium">{trade.quantity}</td>
                    <td className="px-5 py-3.5 text-right font-medium">${trade.price.toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-white">${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-16 text-gray-500 flex flex-col items-center justify-center">
            <span className="text-3xl mb-2">📜</span>
            <p className="text-sm">No transaction audit records found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradeHistory;
