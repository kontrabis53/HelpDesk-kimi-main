import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, RegistrationRequest } from '@/types';
import apiClient from '@/api/client/apiClient';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  requests: RegistrationRequest[];
  isLoading: boolean;
  
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User) => void;
  checkAuth: () => Promise<void>;
  fetchRequests: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  
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
      isLoading: false,

      login: async (username, password) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.post('/auth/login', { username, password });
          const { token, user } = response.data;
          
          localStorage.setItem('auth_token', token);
          set({ user, token, isAuthenticated: true, isLoading: false });
          
          // Fetch requests if admin
          if (user.role === 'admin') {
            get().fetchRequests();
          }
          
          return true;
        } catch (error: any) {
          console.error('Login error:', error);
          set({ isLoading: false });
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        set({ user: null, token: null, isAuthenticated: false, requests: [], isLoading: false });
      },

      setUser: (user) => {
        set({ user, isAuthenticated: true });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          set({ user: null, token: null, isAuthenticated: false });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await apiClient.get('/auth/me');
          const user = response.data;
          set({ user, token, isAuthenticated: true, isLoading: false });
          
          // Fetch requests if admin
          if (user.role === 'admin') {
            get().fetchRequests();
          }
        } catch (error: any) {
          console.error('Check auth error:', error);
          localStorage.removeItem('auth_token');
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
      },

      fetchRequests: async () => {
        set({ isLoading: true });
        try {
          const response = await apiClient.get('/auth/registration-requests');
          set({ requests: response.data, isLoading: false });
        } catch (error: any) {
          console.error('Fetch requests error:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      setLoading: (loading) => set({ isLoading: loading }),

      addRequest: async (data) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.post('/auth/request-registration', data);
          const newRequest = response.data;
          set(state => ({
            requests: [newRequest, ...state.requests],
            isLoading: false
          }));
        } catch (error: any) {
          console.error('Add request error:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      approveRequest: async (id) => {
        set({ isLoading: true });
        try {
          await apiClient.patch(`/auth/registration-requests/${id}`, { status: 'approved' });
          set(state => ({
            requests: state.requests.map(req => 
              req.id === id ? { ...req, status: 'approved' } : req
            ),
            isLoading: false
          }));
        } catch (error: any) {
          console.error('Approve request error:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      rejectRequest: async (id) => {
        set({ isLoading: true });
        try {
          await apiClient.patch(`/auth/registration-requests/${id}`, { status: 'rejected' });
          set(state => ({
            requests: state.requests.map(req => 
              req.id === id ? { ...req, status: 'rejected' } : req
            ),
            isLoading: false
          }));
        } catch (error: any) {
          console.error('Reject request error:', error);
          set({ isLoading: false });
          throw error;
        }
      },
      
      deleteRequest: async (id) => {
        set({ isLoading: true });
        try {
          await apiClient.delete(`/auth/registration-requests/${id}`);
          set(state => ({
            requests: state.requests.filter(req => req.id !== id),
            isLoading: false
          }));
        } catch (error: any) {
          console.error('Delete request error:', error);
          set({ isLoading: false });
          throw error;
        }
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
