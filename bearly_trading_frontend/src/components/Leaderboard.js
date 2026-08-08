import React, { useState, useEffect } from 'react';
import { leaderboard } from '../services/api';
import { Trophy, Activity, Award, Medal } from 'lucide-react';

const Leaderboard = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeaderboard = async () => {
    try {
      setError('');
      const response = await leaderboard.getLeaderboard();
      setEntries(response.data || []);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
      setError("Failed to fetch leaderboard rankings.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-400">
        <Activity className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-lg font-semibold animate-pulse font-sans">Compiling global rankings...</p>
      </div>
    );
  }

  const formatCurrency = (val) => val.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 text-white font-sans bg-gray-950 min-h-screen">
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-gray-900 border border-gray-800 p-6 rounded-2xl gap-4 shadow-xl">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500 fill-yellow-500/25" />
            Global Leaderboard
          </h1>
          <p className="text-gray-400 mt-1">Simulated Net Worth rankings across Bearly Trading accounts.</p>
        </div>
      </div>

      {error && <div className="bg-red-900/50 border border-red-700 text-red-200 p-4 rounded-xl text-center">⚠️ {error}</div>}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800 uppercase text-[10px] tracking-wider bg-gray-950/40">
                <th className="px-6 py-4 text-center">Rank</th>
                <th className="px-6 py-4">Trader Username</th>
                <th className="px-6 py-4 text-right">Cash Reserves</th>
                <th className="px-6 py-4 text-right">Holdings Value</th>
                <th className="px-6 py-4 text-right">Total Net Worth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-850">
              {entries.map((entry, index) => {
                const rank = index + 1;
                
                // Styling ranks
                let rankIcon = <span className="font-bold text-gray-500">{rank}</span>;
                let rankBg = 'hover:bg-gray-850';
                
                if (rank === 1) {
                  rankIcon = <Trophy className="w-5 h-5 text-yellow-500 fill-yellow-500/10 mx-auto" />;
                  rankBg = 'bg-yellow-500/5 hover:bg-yellow-500/10 border-l-4 border-l-yellow-500';
                } else if (rank === 2) {
                  rankIcon = <Award className="w-5 h-5 text-gray-300 fill-gray-300/10 mx-auto" />;
                  rankBg = 'bg-gray-300/5 hover:bg-gray-300/10 border-l-4 border-l-gray-300';
                } else if (rank === 3) {
                  rankIcon = <Medal className="w-5 h-5 text-amber-600 fill-amber-600/10 mx-auto" />;
                  rankBg = 'bg-amber-600/5 hover:bg-amber-600/10 border-l-4 border-l-amber-600';
                }

                return (
                  <tr key={entry.username} className={`transition-colors ${rankBg}`}>
                    <td className="px-6 py-4 text-center">{rankIcon}</td>
                    <td className="px-6 py-4 font-bold text-white tracking-wide">{entry.username}</td>
                    <td className="px-6 py-4 text-right text-gray-400 font-medium">{formatCurrency(entry.cash_balance)}</td>
                    <td className="px-6 py-4 text-right text-gray-400 font-medium">{formatCurrency(entry.holdings_value)}</td>
                    <td className="px-6 py-4 text-right font-extrabold text-white">{formatCurrency(entry.net_worth)}</td>
                  </tr>
                );
              })}

              {entries.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-16 text-gray-500">
                    No active traders found on the leaderboard.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Leaderboard;
