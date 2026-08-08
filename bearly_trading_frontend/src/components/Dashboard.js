import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { portfolio, watchlist, trading, auth } from '../services/api';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Briefcase, 
  Activity, Star, Plus, Trash2, ArrowUpRight, ArrowDownRight, Clock
} from 'lucide-react';

const Dashboard = () => {
  const { user, refreshUserObj } = useAuth();
  const navigate = useNavigate();

  const [portfolioData, setPortfolioData] = useState({
    holdings: [],
    totalValue: 0,
    cashBalance: 100000.0,
    holdingsValue: 0,
    gainLoss: 0,
    gainLossPercent: 0
  });

  const [history, setHistory] = useState([]);
  const [watchlistSymbols, setWatchlistSymbols] = useState([]);
  const [newWatchlistSym, setNewWatchlistSym] = useState('');
  
  // Quick trade state
  const [tradeForm, setTradeForm] = useState({
    symbol: '',
    quantity: '',
    tradeType: 'buy'
  });
  
  const [tradeError, setTradeError] = useState('');
  const [tradeSuccess, setTradeSuccess] = useState('');
  const [watchlistError, setWatchlistError] = useState('');
  const [loading, setLoading] = useState(true);
  const [marketOpen, setMarketOpen] = useState(false);
  const [recentLogs, setRecentLogs] = useState([]);

  // Check market hours (EST: Mon-Fri 9:30 AM - 4:00 PM)
  const checkMarketStatus = () => {
    const now = new Date();
    // Convert to EST/EDT
    const estTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const day = estTime.getDay();
    const hour = estTime.getHours();
    const minute = estTime.getMinutes();
    
    const isWeekday = day >= 1 && day <= 5;
    const isWithinHours = (hour === 9 && minute >= 30) || (hour > 9 && hour < 16);
    
    setMarketOpen(isWeekday && isWithinHours);
  };

  const fetchData = async () => {
    try {
      // 1. Fetch user profile for latest cash
      const userProfile = await auth.getCurrentUser();
      const cash = userProfile.data.cash_balance;

      // 2. Fetch portfolio items
      const portResponse = await portfolio.getPortfolio();
      const holdings = portResponse.data || [];
      const holdingsVal = holdings.reduce((sum, h) => sum + h.totalValue, 0);
      const totalVal = cash + holdingsVal;
      
      const totalCostBasis = holdings.reduce((sum, h) => sum + (h.quantity * h.avgPrice), 0);
      const totalGainLoss = totalVal - (totalCostBasis + cash); // gain/loss relative to initial cash basis + cash
      const totalGainLossPercent = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;

      setPortfolioData({
        holdings,
        totalValue: totalVal,
        cashBalance: cash,
        holdingsValue: holdingsVal,
        gainLoss: totalGainLoss,
        gainLossPercent: totalGainLossPercent
      });

      // 3. Fetch history snapshots
      const histResponse = await portfolio.getHistory();
      setHistory(histResponse.data || []);

      // 4. Fetch watchlist
      const watchResponse = await watchlist.getWatchlist();
      setWatchlistSymbols(watchResponse.data || []);

      // 5. Fetch recent audit logs for activity feed
      const gdprResponse = await auth.exportData();
      const logs = gdprResponse.data?.audit_logs || [];
      setRecentLogs(logs.slice(0, 5)); // Keep last 5 actions

      setLoading(false);
    } catch (error) {
      console.error("Dashboard data fetch failed:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    checkMarketStatus();
    const interval = setInterval(checkMarketStatus, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleQuickTrade = async (e) => {
    e.preventDefault();
    setTradeError('');
    setTradeSuccess('');
    
    const qty = parseInt(tradeForm.quantity);
    if (isNaN(qty) || qty <= 0) {
      setTradeError('Quantity must be greater than zero.');
      return;
    }

    try {
      await trading.executeTrade({
        symbol: tradeForm.symbol.toUpperCase().strip ? tradeForm.symbol.toUpperCase().strip() : tradeForm.symbol.toUpperCase(),
        quantity: qty,
        trade_type: tradeForm.tradeType
      });
      
      setTradeSuccess(`Trade order executed successfully!`);
      setTradeForm({ symbol: '', quantity: '', tradeType: 'buy' });
      
      // Refresh Auth Context Cash Balance & Dashboard
      await refreshUserObj();
      fetchData();
    } catch (err) {
      setTradeError(err.response?.data?.detail || 'Trade failed. Please check inputs.');
    }
  };

  const handleAddWatchlist = async (e) => {
    e.preventDefault();
    setWatchlistError('');
    const sym = newWatchlistSym.trim().toUpperCase();
    if (!sym) return;

    try {
      await watchlist.addToWatchlist(sym);
      setNewWatchlistSym('');
      fetchData();
    } catch (err) {
      setWatchlistError(err.response?.data?.detail || 'Failed to add symbol.');
    }
  };

  const handleRemoveWatchlist = async (sym) => {
    try {
      await watchlist.removeFromWatchlist(sym);
      fetchData();
    } catch (err) {
      console.error("Failed to remove watchlist item:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-400">
        <Activity className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-lg font-semibold animate-pulse">Loading dashboard analytical services...</p>
      </div>
    );
  }

  // Formatting helpers
  const formatCurrency = (val) => val.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const formatPercent = (val) => `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 font-sans text-white bg-gray-950 min-h-screen">
      
      {/* Top Welcome Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-gray-900 border border-gray-800 p-6 rounded-2xl gap-4 shadow-xl">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Welcome, {user?.username}!</h1>
          <p className="text-gray-400 mt-1">Track your simulated assets, perform analysis, and master the markets.</p>
        </div>
        <div className="flex items-center space-x-3 bg-gray-950 px-4 py-2 border border-gray-800 rounded-xl w-max">
          <Clock className={`w-5 h-5 ${marketOpen ? 'text-green-500' : 'text-yellow-500 animate-pulse'}`} />
          <span className="text-sm font-semibold tracking-wide">
            Market Status:{' '}
            <span className={marketOpen ? 'text-green-400 font-bold' : 'text-yellow-400 font-bold'}>
              {marketOpen ? 'OPEN (EST)' : 'CLOSED (EST)'}
            </span>
          </span>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Net Worth Card */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl relative overflow-hidden shadow-xl group hover:border-blue-500 transition-colors duration-350">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Net Worth</p>
            <DollarSign className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{formatCurrency(portfolioData.totalValue)}</p>
          <div className="flex items-center space-x-1 mt-2 text-xs">
            {portfolioData.gainLoss >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-green-500" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-500" />
            )}
            <span className={portfolioData.gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}>
              {formatPercent(portfolioData.gainLossPercent)}
            </span>
            <span className="text-gray-500">All-time</span>
          </div>
        </div>

        {/* Cash Balance Card */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl relative overflow-hidden shadow-xl group hover:border-purple-500 transition-colors duration-350">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cash Balance</p>
            <DollarSign className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{formatCurrency(portfolioData.cashBalance)}</p>
          <p className="text-xs text-gray-500 mt-2">Available for immediate trading</p>
        </div>

        {/* Holdings Value Card */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl relative overflow-hidden shadow-xl group hover:border-emerald-500 transition-colors duration-350">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Assets</p>
            <Briefcase className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{formatCurrency(portfolioData.holdingsValue)}</p>
          <p className="text-xs text-gray-500 mt-2">Valued at real-time market close</p>
        </div>

        {/* Active Holdings Count */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl relative overflow-hidden shadow-xl group hover:border-orange-500 transition-colors duration-350">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Unique Positions</p>
            <Activity className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{portfolioData.holdings.length}</p>
          <p className="text-xs text-gray-500 mt-2">Diversification index across symbols</p>
        </div>

      </div>

      {/* Main Grid: Chart & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Net Worth Chart */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold">Net Worth Trend Analysis</h3>
            <p className="text-xs text-gray-400 mt-1">Simulated valuation history (past 7 days)</p>
          </div>
          
          <div className="h-64 mt-6 w-full">
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="timestamp" stroke="#4b5563" fontSize={11} tickLine={false} />
                  <YAxis 
                    stroke="#4b5563" 
                    fontSize={11} 
                    tickLine={false} 
                    domain={['auto', 'auto']}
                    tickFormatter={(v) => `$${v.toLocaleString('en-US', { notation: 'compact' })}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px', color: '#fff' }}
                    formatter={(val) => [formatCurrency(val), "Net Worth"]}
                  />
                  <Area type="monotone" dataKey="net_worth" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorNetWorth)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">No chart data available yet.</div>
            )}
          </div>
        </div>

        {/* Quick Order Widget */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-500" />
              Place Market Order
            </h3>
            <p className="text-xs text-gray-400 mt-1">Execute immediate paper trades</p>
          </div>

          {tradeError && <div className="text-xs text-red-400 bg-red-950/40 border border-red-900 p-2 rounded-lg mt-3">⚠️ {tradeError}</div>}
          {tradeSuccess && <div className="text-xs text-green-400 bg-green-950/40 border border-green-900 p-2 rounded-lg mt-3">✅ {tradeSuccess}</div>}

          <form onSubmit={handleQuickTrade} className="space-y-4 mt-4 flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTradeForm({ ...tradeForm, tradeType: 'buy' })}
                className={`py-2 px-3 rounded-xl font-bold border transition-colors ${
                  tradeForm.tradeType === 'buy'
                    ? 'bg-green-600/35 border-green-500 text-green-300'
                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => setTradeForm({ ...tradeForm, tradeType: 'sell' })}
                className={`py-2 px-3 rounded-xl font-bold border transition-colors ${
                  tradeForm.tradeType === 'sell'
                    ? 'bg-red-600/35 border-red-500 text-red-300'
                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                SELL
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Ticker Symbol</label>
              <input
                type="text"
                value={tradeForm.symbol}
                onChange={(e) => setTradeForm({ ...tradeForm, symbol: e.target.value.toUpperCase() })}
                className="w-full p-2.5 rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="AAPL, TSLA, MSFT"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Quantity</label>
              <input
                type="number"
                value={tradeForm.quantity}
                onChange={(e) => setTradeForm({ ...tradeForm, quantity: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="0"
                min="1"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all"
            >
              Submit Trade Order
            </button>
          </form>
        </div>

      </div>

      {/* Grid: Watchlist & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Watchlist Section */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              Watchlist
            </h3>
            <p className="text-xs text-gray-400 mt-1">Observe targeted symbols</p>
          </div>

          <form onSubmit={handleAddWatchlist} className="flex space-x-2 mt-4">
            <input
              type="text"
              value={newWatchlistSym}
              onChange={(e) => setNewWatchlistSym(e.target.value)}
              className="flex-1 p-2 rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-600 focus:outline-none text-sm"
              placeholder="Add Ticker (e.g. AMZN)"
            />
            <button
              type="submit"
              className="p-2 bg-gray-850 hover:bg-gray-800 border border-gray-800 rounded-xl"
            >
              <Plus className="w-5 h-5 text-gray-400 hover:text-white" />
            </button>
          </form>
          {watchlistError && <p className="text-xs text-red-400 mt-1">{watchlistError}</p>}

          <div className="mt-4 space-y-2 flex-1 overflow-y-auto max-h-[160px] pr-1 scrollbar-thin">
            {watchlistSymbols.length > 0 ? (
              watchlistSymbols.map((sym) => (
                <div key={sym} className="flex items-center justify-between p-2.5 bg-gray-950 border border-gray-800 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold tracking-wide text-blue-400">{sym}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleRemoveWatchlist(sym)}
                      className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 text-center py-6">Your watchlist is empty.</p>
            )}
          </div>
        </div>

        {/* Audit / Recent Activity Log */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Platform Trading Logs & Activity Feed
            </h3>
            <p className="text-xs text-gray-400 mt-1">Encrypted system activity log</p>
          </div>

          <div className="mt-4 space-y-3 flex-1 overflow-y-auto max-h-[200px]">
            {recentLogs.length > 0 ? (
              recentLogs.map((log, index) => (
                <div key={index} className="flex items-start justify-between p-3 bg-gray-950 border border-gray-800 rounded-xl text-xs gap-3">
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-300">{log.details || log.action}</span>
                    <span className="text-gray-500 text-[10px] mt-0.5">Event: {log.action.toUpperCase()}</span>
                  </div>
                  <span className="text-gray-600 text-[10px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 text-center py-8">No logs recorded in this session.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;