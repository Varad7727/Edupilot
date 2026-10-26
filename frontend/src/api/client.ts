import axios, { AxiosError } from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined && import.meta.env.VITE_API_BASE_URL !== ''
  ? import.meta.env.VITE_API_BASE_URL
  : '';

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Send httpOnly cookie on every request
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: attach token as Bearer backup if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('amit_token');
  if (token) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers = config.headers || {};
      (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor: normalise 401 errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const isAuthRoute = error.config?.url?.includes('/auth/student/login') ||
      error.config?.url?.includes('/auth/teacher/login') ||
      error.config?.url?.includes('/auth/student/register') ||
      error.config?.url?.includes('/auth/teacher/register');

    if (error.response?.status === 401 && !isAuthRoute) {
      // Token expired or invalid on a protected route
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    return Promise.reject(error);
  }
);

export default api;
