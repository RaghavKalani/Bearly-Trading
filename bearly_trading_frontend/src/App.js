import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';

// Import components
import Login from './components/Login';
import Register from './components/register';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Trading from './components/Trading';
import Portfolio from './components/Portfolio';
import Learning from './components/Learning';
import Leaderboard from './components/Leaderboard';
import Settings from './components/Settings';

// Protected Route component
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="text-white text-xl animate-pulse">Initializing auth services...</div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-950 font-sans">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <div className="flex h-screen overflow-hidden">
                    <Sidebar />
                    <main className="flex-1 overflow-auto bg-gray-950">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/trading" element={<Trading />} />
                        <Route path="/portfolio" element={<Portfolio />} />
                        <Route path="/learning" element={<Learning />} />
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        <Route path="/settings" element={<Settings />} />
                        {/* Redirect unmatched routes to dashboard */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </main>
                  </div>
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;