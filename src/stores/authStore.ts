import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, RegistrationRequest } from '@/types';
import apiClient from '@/api/client/apiClient';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  requests: RegistrationRequest[];
  
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User) => void;
  checkAuth: () => Promise<void>;
  
  // Registration requests
  addRequest: (data: Omit<RegistrationRequest, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  approveRequest: (id: string) => Promise<void>;
  rejectRequest: (id: string) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      requests: [],

      login: async (username, password) => {
        try {
          const response = await apiClient.post('/auth/login', { username, password });
          const { token, user } = response.data;
          
          localStorage.setItem('auth_token', token);
          set({ user, token, isAuthenticated: true });
          return true;
        } catch (error: any) {
          console.error('Login error:', error);
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      setUser: (user) => {
        set({ user, isAuthenticated: true });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        try {
          const response = await apiClient.get('/auth/me');
          set({ user: response.data, token, isAuthenticated: true });
        } catch (error: any) {
          localStorage.removeItem('auth_token');
          set({ user: null, token: null, isAuthenticated: false });
        }
      },

      addRequest: async (data) => {
        try {
          const response = await apiClient.post('/auth/register', data);
          const newRequest = response.data;
          set(state => ({
            requests: [newRequest, ...state.requests]
          }));
        } catch (error: any) {
          console.error('Add request error:', error);
        }
      },

      approveRequest: async (id) => {
        // Implement when backend endpoint is ready
        set(state => ({
          requests: state.requests.map(req => 
            req.id === id ? { ...req, status: 'approved' } : req
          )
        }));
      },

      rejectRequest: async (id) => {
        // Implement when backend endpoint is ready
        set(state => ({
          requests: state.requests.map(req => 
            req.id === id ? { ...req, status: 'rejected' } : req
          )
        }));
      },
      
      deleteRequest: async (id) => {
        // Implement when backend endpoint is ready
        set(state => ({
          requests: state.requests.filter(req => req.id !== id)
        }));
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        requests: state.requests 
      }),
    }
  )
);
