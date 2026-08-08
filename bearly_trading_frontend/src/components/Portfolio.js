import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { portfolio, auth } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, TrendingDown, Briefcase, DollarSign, PieChart as ChartIcon, 
  ArrowUpRight, ArrowDownRight, Activity 
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899', '#f97316'];

const Portfolio = () => {
  const { user } = useAuth();
  
  const [portfolioData, setPortfolioData] = useState({
    holdings: [],
    totalValue: 0,
    cashBalance: 100000.0,
    holdingsValue: 0,
    gainLoss: 0,
    gainLossPercent: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPortfolio = async () => {
    try {
      setError('');
      // 1. Fetch current cash balance
      const profileResponse = await auth.getCurrentUser();
      const cash = profileResponse.data.cash_balance;

      // 2. Fetch portfolio positions
      const portResponse = await portfolio.getPortfolio();
      const holdings = portResponse.data || [];
      
      const holdingsValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);
      const totalValue = cash + holdingsValue;
      
      const totalCostBasis = holdings.reduce((sum, h) => sum + (h.quantity * h.avgPrice), 0);
      const gainLoss = totalValue - (totalCostBasis + cash);
      const gainLossPercent = totalCostBasis > 0 ? (gainLoss / totalCostBasis) * 100 : 0;

      setPortfolioData({
        holdings,
        totalValue,
        cashBalance: cash,
        holdingsValue,
        gainLoss,
        gainLossPercent
      });
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch portfolio:', err);
      setError('Could not retrieve portfolio information.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-400">
        <Activity className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-lg font-semibold animate-pulse">Analyzing portfolio assets...</p>
      </div>
    );
  }

  const formatCurrency = (val) => val.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const formatPercent = (val) => `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;

  // Prepare allocation data for Pie Chart
  const pieData = portfolioData.holdings.map(h => ({
    name: h.symbol,
    value: h.totalValue
  }));

  // Add Cash as a slice if it's a positive balance
  if (portfolioData.cashBalance > 0) {
    pieData.push({
      name: 'CASH',
      value: portfolioData.cashBalance
    });
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-white font-sans bg-gray-950 min-h-screen">
      
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Portfolio Asset Manager</h1>
        <p className="text-gray-400 mt-1">Review asset performance metrics, cost bases, and allocation metrics.</p>
      </div>

      {error && <div className="bg-red-900/50 border border-red-700 text-red-200 p-4 rounded-xl text-center">⚠️ {error}</div>}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl relative shadow-xl">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Portfolio Value</p>
          <p className="text-2xl font-bold mt-2">{formatCurrency(portfolioData.totalValue)}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl relative shadow-xl">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cash Reserves</p>
          <p className="text-2xl font-bold mt-2">{formatCurrency(portfolioData.cashBalance)}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl relative shadow-xl">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Invested Capital</p>
          <p className="text-2xl font-bold mt-2">{formatCurrency(portfolioData.holdingsValue)}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl relative shadow-xl">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Portfolio Yield</p>
          <p className="text-2xl font-bold mt-2">{formatCurrency(portfolioData.gainLoss)}</p>
          <div className="flex items-center space-x-1 mt-1 text-xs">
            {portfolioData.gainLoss >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-green-500" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-500" />
            )}
            <span className={portfolioData.gainLoss >= 0 ? 'text-green-400' : 'text-red-400 font-semibold'}>
              {formatPercent(portfolioData.gainLossPercent)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Holdings Table */}
        <div className="lg:col-span-8 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/50">
            <h3 className="font-bold text-white tracking-tight">Active Asset Positions</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800 uppercase text-[10px] tracking-wider bg-gray-950/40">
                  <th className="px-6 py-3">Ticker</th>
                  <th className="px-6 py-3 text-right">Shares</th>
                  <th className="px-6 py-3 text-right">Avg Cost</th>
                  <th className="px-6 py-3 text-right">Last Price</th>
                  <th className="px-6 py-3 text-right">Total Value</th>
                  <th className="px-6 py-3 text-right">Unrealized P&L</th>
                  <th className="px-6 py-3 text-right">% Return</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-850">
                {portfolioData.holdings.map((holding) => {
                  const isProfit = holding.gainLoss >= 0;
                  return (
                    <tr key={holding.symbol} className="text-gray-300 hover:bg-gray-850 transition-colors">
                      <td className="px-6 py-4 font-extrabold text-white tracking-wide">{holding.symbol}</td>
                      <td className="px-6 py-4 text-right font-medium">{holding.quantity}</td>
                      <td className="px-6 py-4 text-right font-medium">${holding.avgPrice.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right font-medium">${holding.currentPrice.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right font-bold text-white">${holding.totalValue.toFixed(2)}</td>
                      <td className={`px-6 py-4 text-right font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                        {isProfit ? '+' : ''}${holding.gainLoss.toFixed(2)}
                      </td>
                      <td className={`px-6 py-4 text-right font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                        {isProfit ? '+' : ''}{holding.gainLossPercent.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {portfolioData.holdings.length === 0 && (
              <div className="text-center py-16 text-gray-500 flex flex-col items-center justify-center">
                <span className="text-3xl mb-2">💼</span>
                <p className="text-sm">No active holdings found in your portfolio.</p>
                <Link to="/trading" className="mt-3 text-xs text-blue-400 hover:text-blue-300 font-bold transition-colors uppercase tracking-wider">
                  Open Trading Desk &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Allocation Breakdown Chart */}
        <div className="lg:col-span-4 bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div className="border-b border-gray-850 pb-3 mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ChartIcon className="w-5 h-5 text-purple-500" />
              Asset Allocation
            </h3>
            <p className="text-xs text-gray-500 mt-1 font-medium">Diversification ratio across capital reserves</p>
          </div>

          <div className="h-64 w-full">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px', color: '#fff' }}
                    formatter={(val) => [formatCurrency(val), "Allocation"]}
                  />
                  <Legend verticalAlign="bottom" height={36} iconSize={10} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">No allocation data.</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Portfolio;
