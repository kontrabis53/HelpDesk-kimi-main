import { mockKBArticles } from '../data/mockDocuments';
import type { KBArticle } from '@/types';

// In a real application, this would be an API client making HTTP requests
export const knowledgeService = {
  getAll: (): KBArticle[] => {
    return mockKBArticles;
  },

  getById: (id: string): KBArticle | undefined => {
    return mockKBArticles.find((article: KBArticle) => article.id === id);
  },

  create: (articleData: Omit<KBArticle, 'id' | 'createdAt' | 'updatedAt'>): KBArticle => {
    const newArticle = {
      ...articleData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0,
    } as KBArticle;
    
    mockKBArticles.push(newArticle);
    return newArticle;
  },

  update: (id: string, updates: Partial<KBArticle>): KBArticle | undefined => {
    const index = mockKBArticles.findIndex((g: KBArticle) => g.id === id);
    if (index === -1) return undefined;
    
    mockKBArticles[index] = { ...mockKBArticles[index], ...updates };
    return mockKBArticles[index];
  },
  
  delete: (id: string): void => {
    const index = mockKBArticles.findIndex((g: KBArticle) => g.id === id);
    if (index !== -1) {
      mockKBArticles.splice(index, 1);
    }
  },

  incrementViews: (id: string): void => {
    const article = mockKBArticles.find((g: KBArticle) => g.id === id);
    if (article) {
      article.views += 1;
    }
  }
};
