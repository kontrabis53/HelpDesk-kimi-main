import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, RegistrationRequest } from '@/types';
import { users, mockRequests } from '@/data/mock';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  requests: RegistrationRequest[];
  
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User) => void;
  
  // Registration requests
  addRequest: (data: Omit<RegistrationRequest, 'id' | 'status' | 'createdAt'>) => void;
  approveRequest: (id: string) => void;
  rejectRequest: (id: string) => void;
  deleteRequest: (id: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null, // Start with null to require login
      isAuthenticated: false,
      requests: mockRequests,

      login: async (username, password) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const foundUser = users.find(u => u.username === username && u.password === password);
        
        if (foundUser) {
          set({ user: foundUser, isAuthenticated: true });
          return true;
        }
        
        return false;
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      setUser: (user) => {
        set({ user, isAuthenticated: true });
      },

      addRequest: (data) => {
        const newRequest: RegistrationRequest = {
          ...data,
          id: Date.now().toString(),
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        
        set(state => ({
          requests: [newRequest, ...state.requests]
        }));
      },

      approveRequest: (id) => {
        set(state => ({
          requests: state.requests.map(req => 
            req.id === id ? { ...req, status: 'approved' } : req
          )
        }));
        
        // In a real app, this would also create a user account
        // Here we could simulate it by adding to the users list in memory if needed
      },

      rejectRequest: (id) => {
        set(state => ({
          requests: state.requests.map(req => 
            req.id === id ? { ...req, status: 'rejected' } : req
          )
        }));
      },
      
      deleteRequest: (id) => {
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
        requests: state.requests 
      }),
    }
  )
);
