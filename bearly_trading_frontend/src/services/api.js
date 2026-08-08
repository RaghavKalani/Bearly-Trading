import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,  // Crucial for cookie-based refresh tokens
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor: handle token refresh & retries
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is due to a network issue and can be retried
    if (!error.response && !originalRequest._retryCount && originalRequest._retryCount < 2) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      const backoffDelay = originalRequest._retryCount * 1000;
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      return api(originalRequest);
    }

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url === '/users/refresh' || originalRequest.url === '/users/login') {
        // If refresh or login itself returns 401, clear storage and bubble error
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to call refresh token endpoint
        const response = await axios.post(`${API_URL}/users/refresh`, {}, { withCredentials: true });
        const { access_token, user_id, username, email } = response.data;
        
        localStorage.setItem('token', access_token);
        localStorage.setItem('user', JSON.stringify({ id: user_id, username, email, token: access_token }));
        
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
        
        processQueue(null, access_token);
        isRefreshing = false;
        
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // Log out user
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const auth = {
  login: (credentials) => api.post('/users/login', credentials),
  register: (userData) => api.post('/users/register', userData),
  googleLogin: (credential) => api.post('/users/google-login', { credential }),
  refresh: () => api.post('/users/refresh'),
  logout: () => api.post('/users/logout'),
  getCurrentUser: () => api.get('/users/me'),
  verifyEmail: () => api.post('/users/verify-email'),
  requestPasswordReset: (email) => api.post('/users/reset-password/request', { email }),
  confirmPasswordReset: (email, new_password) => api.post('/users/reset-password/confirm', { email, new_password }),
  exportData: () => api.get('/users/export-data'),
  deleteAccount: () => api.delete('/users/delete-account'),
};

export const trading = {
  executeTrade: (tradeData) => api.post('/trading/trade', tradeData),
  getPrice: (symbol) => api.get(`/trading/price/${symbol}`),
  getHistory: () => api.get('/trading/history'),
};

export const portfolio = {
  getPortfolio: () => api.get('/portfolio'),
  getHistory: () => api.get('/portfolio/history'),
};

export const leaderboard = {
  getLeaderboard: () => api.get('/leaderboard'),
};

export const watchlist = {
  getWatchlist: () => api.get('/watchlist'),
  addToWatchlist: (symbol) => api.post('/watchlist/add', { symbol }),
  removeFromWatchlist: (symbol) => api.delete(`/watchlist/remove/${symbol}`),
};

export default api;