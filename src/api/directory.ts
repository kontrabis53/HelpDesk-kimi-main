import apiClient from './client/apiClient';
import type { DirectoryEntry } from '@/types';

export const directoryService = {
  getAll: async (): Promise<DirectoryEntry[]> => {
    const response = await apiClient.get('/directory');
    return response.data;
  },

  getById: async (id: string): Promise<DirectoryEntry> => {
    const response = await apiClient.get(`/directory/${id}`);
    return response.data;
  },

  create: async (entry: any): Promise<DirectoryEntry> => {
    const response = await apiClient.post('/directory', entry);
    return response.data;
  },

  update: async (id: string, updates: any): Promise<DirectoryEntry> => {
    const response = await apiClient.patch(`/directory/${id}`, updates);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/directory/${id}`);
  }
};
