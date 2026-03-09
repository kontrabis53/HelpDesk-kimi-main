import { create } from 'zustand';
import type { KnowledgeGuide, KnowledgeFilter } from '@/types';
import { knowledgeService } from '@/api/knowledge';

interface KnowledgeStore {
  guides: KnowledgeGuide[];
  filter: KnowledgeFilter;
  selectedGuide: KnowledgeGuide | null;
  setFilter: (filter: Partial<KnowledgeFilter>) => void;
  setSelectedGuide: (guide: KnowledgeGuide | null) => void;
  createGuide: (guide: Omit<KnowledgeGuide, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateGuide: (id: string, updates: Partial<KnowledgeGuide>) => void;
  deleteGuide: (id: string) => void;
  incrementViews: (id: string) => void;
  getGuideById: (id: string) => KnowledgeGuide | undefined;
}

export const useKnowledgeStore = create<KnowledgeStore>((set) => ({
  guides: knowledgeService.getAll(),
  filter: {},
  selectedGuide: null,
  
  getGuideById: (id) => {
    return knowledgeService.getById(id);
  },

  setFilter: (newFilter) => set((state) => ({ 
    filter: { ...state.filter, ...newFilter } 
  })),
  
  setSelectedGuide: (guide) => set({ selectedGuide: guide }),
  
  createGuide: (guideData) => {
    const newGuide = knowledgeService.create(guideData);
    set((state) => ({
      guides: [...state.guides, newGuide]
    }));
  },

  updateGuide: (id, updates) => {
    knowledgeService.update(id, updates);
    set((state) => ({
      guides: state.guides.map((g) => 
        g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g
      ),
    }));
  },

  deleteGuide: (id) => {
    knowledgeService.delete(id);
    set((state) => ({
      guides: state.guides.filter((g) => g.id !== id),
    }));
  },
  
  incrementViews: (id) => {
    knowledgeService.incrementViews(id);
    set((state) => ({
      guides: state.guides.map((g) => 
        g.id === id ? { ...g, views: g.views + 1 } : g
      ),
    }));
  },
}));
