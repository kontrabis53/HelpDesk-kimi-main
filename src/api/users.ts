import apiClient from './client/apiClient';
import type { User } from '@/types';

export const userService = {
  getAll: async (): Promise<User[]> => {
    const response = await apiClient.get('/users');
    return response.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  getByRole: async (role: string): Promise<User[]> => {
    const response = await apiClient.get('/users');
    return response.data.filter((user: User) => user.role === role);
  },
};
