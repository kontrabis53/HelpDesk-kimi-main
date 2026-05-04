import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to every request
apiClient.interceptors.request.use(
  (config) => {
    // Try to get token from localStorage first (for speed)
    let token = localStorage.getItem('auth_token');
    
    // Fallback to Zustand store if not in localStorage or for extra safety
    if (!token && typeof window !== 'undefined' && (window as any).useAuthStore) {
      token = (window as any).useAuthStore.getState().token;
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle common errors (like 401 Unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isDeactivated = error.response?.status === 403 && error.response?.data?.code === 'USER_DEACTIVATED';
    
    if (error.response?.status === 401 || isDeactivated) {
      // Clear token and update store state if possible
      if (typeof window !== 'undefined' && (window as any).useAuthStore) {
        (window as any).useAuthStore.getState().logout();
      } else {
        localStorage.removeItem('auth_token');
      }
      
      const searchParams = isDeactivated ? '?error=deactivated' : '';
      if (window.location.pathname !== '/login') {
        window.location.href = `/login${searchParams}`;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
