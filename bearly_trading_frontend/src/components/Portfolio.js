import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { portfolio } from '../services/api';
import { TrendingUp, TrendingDown } from 'lucide-react';

const Portfolio = () => {
  const { user } = useAuth();
  const [portfolioData, setPortfolioData] = useState({
    holdings: [],
    totalValue: 0,
    cashBalance: 10000,
    totalGainLoss: 0,
    totalGainLossPercent: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const userId = user?.id ?? user?.user_id;
        if (!userId) {
          setLoading(false);
          return;
        }

        const response = await portfolio.getPortfolio(userId);
        const holdings = (response.data || []).map((item) => ({
          symbol: item.symbol,
          quantity: item.quantity,
          avgPrice: item.current_price,
          currentPrice: item.current_price,
          totalValue: item.total_value,
          gainLoss: 0,
          gainLossPercent: 0
        }));

        const totalValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);
        const cashBalance = 10000;
        const totalGainLoss = 0;

        setPortfolioData({
          holdings,
          totalValue: totalValue + cashBalance,
          cashBalance,
          totalGainLoss,
          totalGainLossPercent: 0
        });
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch portfolio:', err);
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-xl">Loading portfolio...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-white mb-6">Portfolio</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-gray-400 text-sm mb-2">Total Value</h3>
          <p className="text-2xl font-bold text-white">
            ${portfolioData.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-gray-400 text-sm mb-2">Cash Balance</h3>
          <p className="text-2xl font-bold text-white">
            ${portfolioData.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-gray-400 text-sm mb-2">Total Gain/Loss</h3>
          <div className="flex items-center space-x-2">
            <p className={`text-2xl font-bold ${portfolioData.totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${Math.abs(portfolioData.totalGainLoss).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            {portfolioData.totalGainLoss >= 0 ? (
              <TrendingUp className="text-green-500" size={24} />
            ) : (
              <TrendingDown className="text-red-500" size={24} />
            )}
          </div>
          <p className={`text-sm ${portfolioData.totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {portfolioData.totalGainLoss >= 0 ? '+' : ''}{portfolioData.totalGainLossPercent.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Holdings</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="px-6 py-3">Symbol</th>
                <th className="px-6 py-3">Quantity</th>
                <th className="px-6 py-3">Avg Price</th>
                <th className="px-6 py-3">Current Price</th>
                <th className="px-6 py-3">Total Value</th>
                <th className="px-6 py-3">Gain/Loss</th>
                <th className="px-6 py-3">%</th>
              </tr>
            </thead>
            <tbody>
              {portfolioData.holdings.map((holding) => (
                <tr key={holding.symbol} className="text-white border-b border-gray-700 hover:bg-gray-700">
                  <td className="px-6 py-4 font-bold">{holding.symbol}</td>
                  <td className="px-6 py-4">{holding.quantity}</td>
                  <td className="px-6 py-4">${holding.avgPrice.toFixed(2)}</td>
                  <td className="px-6 py-4">${holding.currentPrice.toFixed(2)}</td>
                  <td className="px-6 py-4">${holding.totalValue.toFixed(2)}</td>
                  <td className={`px-6 py-4 ${holding.gainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {holding.gainLoss >= 0 ? '+' : ''}${holding.gainLoss.toFixed(2)}
                  </td>
                  <td className={`px-6 py-4 ${holding.gainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {holding.gainLoss >= 0 ? '+' : ''}{holding.gainLossPercent.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {portfolioData.holdings.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No holdings yet. Start trading to build your portfolio!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
