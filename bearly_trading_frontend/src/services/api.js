import axios from 'axios';

// Use environment variable for production, fallback to localhost for development
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authentication token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  login: (credentials) => api.post('/users/login', credentials),
  register: (userData) => api.post('/users/register', userData),
  googleLogin: (credential) => api.post('/users/google-login', { credential }),
};

export const trading = {
  executeTrade: (userId, tradeData) => api.post(`/trading/trade/${userId}`, tradeData),
  getTradeHistory: (userId) => api.get(`/trading/history/${userId}`),
};

export const portfolio = {
  getPortfolio: (userId) => api.get(`/portfolio/${userId}`),
};

export const leaderboard = {
  getLeaderboard: () => api.get('/leaderboard'),
};

export default api;