import apiClient from './client/apiClient';
import type { User } from '@/types';

export const userService = {
  getAll: async (): Promise<User[]> => {
    const response = await apiClient.get('/directory'); // We can use directory for general user list or add a specific route
    return response.data;
  },

  getById: async (_id: string): Promise<User> => {
    const response = await apiClient.get(`/auth/me`); // Or specific user route if implemented
    return response.data;
  },

  getByRole: async (role: string): Promise<User[]> => {
    const response = await apiClient.get('/directory');
    return response.data.filter((user: User) => user.role === role);
  },
};
