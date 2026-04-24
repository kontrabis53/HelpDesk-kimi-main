import { create } from 'zustand';
import type { KBArticle, KnowledgeFilter } from '@/types';
import { knowledgeService } from '@/api/knowledge';

interface KnowledgeStore {
  articles: KBArticle[];
  filter: KnowledgeFilter;
  selectedArticle: KBArticle | null;
  isLoading: boolean;
  
  fetchArticles: () => Promise<void>;
  setFilter: (filter: Partial<KnowledgeFilter>) => void;
  setSelectedArticle: (article: KBArticle | null) => void;
  createArticle: (article: any) => Promise<KBArticle>;
  updateArticle: (id: string, updates: Partial<KBArticle>) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  getArticleById: (id: string) => Promise<KBArticle | null>;
  incrementViews: (id: string) => Promise<void>;
}

export const useKnowledgeStore = create<KnowledgeStore>((set) => ({
  articles: [],
  filter: {},
  selectedArticle: null,
  isLoading: false,
  
  incrementViews: async (id) => {
    try {
      await knowledgeService.incrementViews(id);
      set(state => ({
        articles: state.articles.map(a => 
          a.id === id ? { ...a, views: a.views + 1 } : a
        )
      }));
    } catch (error) {
      console.error('Increment views error:', error);
    }
  },
  
  fetchArticles: async () => {
    set({ isLoading: true });
    try {
      const articles = await knowledgeService.getAll();
      set({ articles, isLoading: false });
    } catch (error: any) {
      console.error('Fetch articles error:', error);
      set({ isLoading: false });
    }
  },

  getArticleById: async (id) => {
    try {
      const article = await knowledgeService.getById(id);
      return article;
    } catch (error: any) {
      console.error('Get article error:', error);
      return null;
    }
  },

  setFilter: (newFilter) => set((state) => ({ 
    filter: { ...state.filter, ...newFilter } 
  })),
  
  setSelectedArticle: (article) => set({ selectedArticle: article }),
  
  createArticle: async (articleData) => {
    try {
      const newArticle = await knowledgeService.create(articleData);
      set((state) => ({
        articles: [newArticle, ...state.articles]
      }));
      return newArticle;
    } catch (error: any) {
      console.error('Create article error:', error);
      throw error;
    }
  },

  updateArticle: async (id, updates) => {
    set({ isLoading: true });
    try {
      const updated = await knowledgeService.update(id, updates);
      set((state) => ({
        articles: state.articles.map((a) => a.id === id ? updated : a),
        selectedArticle: state.selectedArticle?.id === id ? updated : state.selectedArticle,
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Update article error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  deleteArticle: async (id) => {
    set({ isLoading: true });
    try {
      await knowledgeService.delete(id);
      set((state) => ({
        articles: state.articles.filter((a) => a.id !== id),
        selectedArticle: state.selectedArticle?.id === id ? null : state.selectedArticle,
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Delete article error:', error);
      set({ isLoading: false });
      throw error;
    }
  },
}));
