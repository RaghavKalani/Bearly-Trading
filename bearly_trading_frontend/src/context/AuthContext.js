import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../services/api';

const AuthContext = createContext(null);

const normalizeUserData = (userData) => ({
  ...userData,
  id: userData?.id ?? userData?.user_id,
  user_id: userData?.user_id ?? userData?.id,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(normalizeUserData(JSON.parse(storedUser)));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await auth.login({ email, password });
      const userData = normalizeUserData(response.data);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', userData.token); // Save token for API requests
      return userData;
    } catch (error) {
      throw error.response?.data?.detail || 'Login failed';
    }
  };

  const register = async (userData) => {
    try {
      const response = await auth.register(userData);
      const newUser = normalizeUserData(response.data);
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('token', newUser.token);
      return newUser;
    } catch (error) {
      throw error.response?.data?.detail || 'Registration failed';
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const googleLogin = async (credential) => {
    try {
      const response = await auth.googleLogin(credential);
      const userData = normalizeUserData(response.data);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', userData.token);
      return userData;
    } catch (error) {
      throw error.response?.data?.detail || 'Google login failed';
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    googleLogin,
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