import apiClient from './client/apiClient';
import type { Ticket } from '@/types';

export const ticketService = {
  getAll: async (archived = false): Promise<Ticket[]> => {
    const response = await apiClient.get('/tickets', { params: { archived } });
    return response.data;
  },

  getById: async (id: string): Promise<Ticket> => {
    const response = await apiClient.get(`/tickets/${id}`);
    return response.data;
  },

  create: async (ticketData: any): Promise<Ticket> => {
    const response = await apiClient.post('/tickets', ticketData);
    return response.data;
  },

  update: async (id: string, updates: any): Promise<Ticket> => {
    const response = await apiClient.patch(`/tickets/${id}`, updates);
    return response.data;
  },

  archive: async (id: string): Promise<Ticket> => {
    const response = await apiClient.post(`/tickets/${id}/archive`);
    return response.data;
  },

  unarchive: async (id: string): Promise<Ticket> => {
    const response = await apiClient.post(`/tickets/${id}/unarchive`);
    return response.data;
  },

  addComment: async (ticketId: string, text: string): Promise<any> => {
    const response = await apiClient.post(`/tickets/${ticketId}/comments`, { text });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tickets/${id}`);
  }
};
