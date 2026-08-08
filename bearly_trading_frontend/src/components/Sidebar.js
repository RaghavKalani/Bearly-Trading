import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, TrendingUp, Briefcase, BookOpen, Trophy, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BearLogo from './BearLogo';

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Trading', path: '/trading', icon: TrendingUp },
    { name: 'Portfolio', path: '/portfolio', icon: Briefcase },
    { name: 'Learning', path: '/learning', icon: BookOpen },
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
  ];

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col h-screen">
      <div className="p-4 flex items-center space-x-3 border-b border-gray-700">
        <BearLogo className="w-10 h-10" />
        <h1 className="text-xl font-bold">Bear Trading</h1>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={logout}
          className="flex items-center space-x-3 p-3 rounded-lg w-full text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
