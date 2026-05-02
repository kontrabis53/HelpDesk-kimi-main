import apiClient from './client/apiClient';
import type { KBArticle } from '@/types';

export const knowledgeService = {
  getAll: async (): Promise<KBArticle[]> => {
    const response = await apiClient.get('/knowledge');
    return response.data;
  },

  getById: async (id: string): Promise<KBArticle> => {
    const response = await apiClient.get(`/knowledge/${id}`);
    return response.data;
  },

  create: async (articleData: any): Promise<KBArticle> => {
    const response = await apiClient.post('/knowledge', articleData);
    return response.data;
  },

  update: async (id: string, updates: Partial<KBArticle>): Promise<KBArticle> => {
    const response = await apiClient.patch(`/knowledge/${id}`, updates);
    return response.data;
  },

  incrementViews: async (id: string, viewKey?: string): Promise<void> => {
    await apiClient.patch(`/knowledge/${id}/increment-views`, undefined, {
      headers: viewKey ? { 'x-view-key': viewKey } : undefined
    });
  },
  
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/knowledge/${id}`);
  }
};
