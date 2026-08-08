import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await auth.getCurrentUser();
          const profile = response.data;
          const userObj = {
            id: profile.id,
            username: profile.username,
            email: profile.email,
            cashBalance: profile.cash_balance,
            emailVerified: profile.email_verified,
          };
          setUser(userObj);
          localStorage.setItem('user', JSON.stringify(userObj));
        } catch (error) {
          console.error("Auth initialization failed, clearing credentials:", error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await auth.login({ email, password });
      const { access_token, user_id, username, email: userEmail } = response.data;
      
      localStorage.setItem('token', access_token);
      // Fetch latest profile to get cash balance
      const profileResponse = await auth.getCurrentUser();
      const profile = profileResponse.data;

      const userObj = {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        cashBalance: profile.cash_balance,
        emailVerified: profile.email_verified,
      };
      
      setUser(userObj);
      localStorage.setItem('user', JSON.stringify(userObj));
      return userObj;
    } catch (error) {
      throw error.response?.data?.detail || 'Login failed';
    }
  };

  const register = async (username, email, password) => {
    try {
      await auth.register({ username, email, password });
      // After registration, automatically log in
      return await login(email, password);
    } catch (error) {
      throw error.response?.data?.detail || 'Registration failed';
    }
  };

  const logout = async () => {
    try {
      await auth.logout();
    } catch (error) {
      console.warn("Logout request to server failed:", error);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  };

  const googleLogin = async (credential) => {
    try {
      const response = await auth.googleLogin(credential);
      const { access_token } = response.data;
      
      localStorage.setItem('token', access_token);
      const profileResponse = await auth.getCurrentUser();
      const profile = profileResponse.data;

      const userObj = {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        cashBalance: profile.cash_balance,
        emailVerified: profile.email_verified,
      };
      
      setUser(userObj);
      localStorage.setItem('user', JSON.stringify(userObj));
      return userObj;
    } catch (error) {
      throw error.response?.data?.detail || 'Google login failed';
    }
  };

  const verifyEmail = async () => {
    try {
      await auth.verifyEmail();
      setUser(prev => {
        if (!prev) return null;
        const updated = { ...prev, emailVerified: true };
        localStorage.setItem('user', JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      throw error.response?.data?.detail || 'Email verification failed';
    }
  };

  const refreshUserObj = async () => {
    try {
      const profileResponse = await auth.getCurrentUser();
      const profile = profileResponse.data;
      const userObj = {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        cashBalance: profile.cash_balance,
        emailVerified: profile.email_verified,
      };
      setUser(userObj);
      localStorage.setItem('user', JSON.stringify(userObj));
      return userObj;
    } catch (error) {
      console.error("Failed to refresh user details:", error);
    }
  };

  const deleteAccount = async () => {
    try {
      await auth.deleteAccount();
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    googleLogin,
    verifyEmail,
    refreshUserObj,
    deleteAccount,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;