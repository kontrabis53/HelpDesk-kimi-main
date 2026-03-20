import { create } from 'zustand';
import type { KBArticle, KnowledgeFilter } from '@/types';
import { knowledgeService } from '@/api/knowledge';

interface KnowledgeStore {
  articles: KBArticle[];
  filter: KnowledgeFilter;
  selectedArticle: KBArticle | null;
  setFilter: (filter: Partial<KnowledgeFilter>) => void;
  setSelectedArticle: (article: KBArticle | null) => void;
  createArticle: (article: Omit<KBArticle, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateArticle: (id: string, updates: Partial<KBArticle>) => void;
  deleteArticle: (id: string) => void;
  incrementViews: (id: string) => void;
  getArticleById: (id: string) => KBArticle | undefined;
}

export const useKnowledgeStore = create<KnowledgeStore>((set) => ({
  articles: knowledgeService.getAll(),
  filter: {},
  selectedArticle: null,
  
  getArticleById: (id) => {
    return knowledgeService.getById(id);
  },

  setFilter: (newFilter) => set((state) => ({ 
    filter: { ...state.filter, ...newFilter } 
  })),
  
  setSelectedArticle: (article) => set({ selectedArticle: article }),
  
  createArticle: (articleData) => {
    const newArticle = knowledgeService.create(articleData);
    set((state) => ({
      articles: [...state.articles, newArticle]
    }));
  },

  updateArticle: (id, updates) => {
    knowledgeService.update(id, updates);
    set((state) => ({
      articles: state.articles.map((a) => 
        a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
      ),
    }));
  },

  deleteArticle: (id) => {
    knowledgeService.delete(id);
    set((state) => ({
      articles: state.articles.filter((a) => a.id !== id),
    }));
  },
  
  incrementViews: (id) => {
    knowledgeService.incrementViews(id);
    set((state) => ({
      articles: state.articles.map((a) => 
        a.id === id ? { ...a, views: a.views + 1 } : a
      ),
    }));
  },
}));
