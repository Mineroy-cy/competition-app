import axios from 'axios';

const axiosInstance = axios.create({
  // Use VITE_API_URL from .env file, fallback to localhost for local dev if it's missing
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', 
});

// Request interceptor to add the auth token header to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const requestPath = config.url || '';
    const isPublicAuthRoute = requestPath.includes('/auth/login') || requestPath.includes('/auth/register');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!isPublicAuthRoute && user && user.token) {
      config.headers['Authorization'] = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to recover from stale/invalid auth state.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
