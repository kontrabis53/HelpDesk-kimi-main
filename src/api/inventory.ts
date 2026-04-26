import apiClient from './client/apiClient';
import type { InventoryItem } from '@/types';

export const inventoryService = {
  getAll: async (): Promise<InventoryItem[]> => {
    const response = await apiClient.get('/inventory');
    return response.data;
  },

  getById: async (id: string): Promise<InventoryItem> => {
    const response = await apiClient.get(`/inventory/${id}`);
    return response.data;
  },

  create: async (item: any): Promise<InventoryItem> => {
    const response = await apiClient.post('/inventory', item);
    return response.data;
  },

  update: async (id: string, updates: any): Promise<InventoryItem> => {
    const response = await apiClient.patch(`/inventory/${id}`, updates);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/inventory/${id}`);
  }
};
