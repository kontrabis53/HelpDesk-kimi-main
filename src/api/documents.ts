import apiClient from './client/apiClient';
import type { Document } from '@/types';

export const documentService = {
  getAll: async (): Promise<Document[]> => {
    const response = await apiClient.get('/documents');
    return response.data;
  },

  getById: async (id: string): Promise<Document> => {
    const response = await apiClient.get(`/documents/${id}`);
    return response.data;
  },

  create: async (doc: any): Promise<Document> => {
    const response = await apiClient.post('/documents', doc);
    return response.data;
  },

  update: async (id: string, updates: any): Promise<Document> => {
    const response = await apiClient.patch(`/documents/${id}`, updates);
    return response.data;
  },

  archive: async (id: string): Promise<Document> => {
    const response = await apiClient.patch(`/documents/${id}/archive`);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/documents/${id}`);
  }
};
