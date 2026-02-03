import { create } from 'zustand';
import type { KnowledgeGuide, KnowledgeCategory } from '@/types';
import { mockGuides } from '@/data/mock';

interface KnowledgeFilter {
  category?: KnowledgeCategory;
  search?: string;
}

interface KnowledgeStore {
  // State
  guides: KnowledgeGuide[];
  selectedGuide: KnowledgeGuide | null;
  filter: KnowledgeFilter;
  
  // Computed
  filteredGuides: () => KnowledgeGuide[];
  guidesByCategory: () => {
    all: KnowledgeGuide[];
    hardware: KnowledgeGuide[];
    software: KnowledgeGuide[];
    network: KnowledgeGuide[];
    printer: KnowledgeGuide[];
    common: KnowledgeGuide[];
  };
  popularGuides: () => KnowledgeGuide[];
  
  // Actions
  setGuides: (guides: KnowledgeGuide[]) => void;
  setSelectedGuide: (guide: KnowledgeGuide | null) => void;
  setFilter: (filter: KnowledgeFilter) => void;
  getGuideById: (id: string) => KnowledgeGuide | undefined;
  incrementViews: (guideId: string) => void;
  createGuide: (data: Omit<KnowledgeGuide, 'id' | 'views' | 'createdAt' | 'updatedAt'>) => KnowledgeGuide;
  updateGuide: (guideId: string, data: Partial<KnowledgeGuide>) => void;
  deleteGuide: (guideId: string) => void;
}

export const useKnowledgeStore = create<KnowledgeStore>((set, get) => ({
  // Initial state
  guides: mockGuides,
  selectedGuide: null,
  filter: {},
  
  // Computed selectors
  filteredGuides: () => {
    const { guides, filter } = get();
    return guides.filter((guide) => {
      if (filter.category && guide.category !== filter.category) return false;
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const matchesSearch =
          guide.title.toLowerCase().includes(searchLower) ||
          guide.description.toLowerCase().includes(searchLower) ||
          guide.content.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      return true;
    }).sort((a, b) => b.views - a.views);
  },
  
  guidesByCategory: () => {
    const filtered = get().filteredGuides();
    return {
      all: filtered,
      hardware: filtered.filter(g => g.category === 'hardware'),
      software: filtered.filter(g => g.category === 'software'),
      network: filtered.filter(g => g.category === 'network'),
      printer: filtered.filter(g => g.category === 'printer'),
      common: filtered.filter(g => g.category === 'common'),
    };
  },
  
  popularGuides: () => {
    const { guides } = get();
    return [...guides]
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  },
  
  // Actions
  setGuides: (guides) => set({ guides }),
  
  setSelectedGuide: (guide) => set({ selectedGuide: guide }),
  
  setFilter: (filter) => set({ filter }),
  
  getGuideById: (id) => {
    return get().guides.find(g => g.id === id);
  },
  
  incrementViews: (guideId) => {
    set((state) => ({
      guides: state.guides.map((guide) => {
        if (guide.id === guideId) {
          return {
            ...guide,
            views: guide.views + 1,
          };
        }
        return guide;
      }),
    }));
    
    // Update selected guide if it's the one being viewed
    const { selectedGuide } = get();
    if (selectedGuide?.id === guideId) {
      const updated = get().getGuideById(guideId);
      if (updated) set({ selectedGuide: updated });
    }
  },
  
  createGuide: (data) => {
    const { guides } = get();
    const newGuide: KnowledgeGuide = {
      ...data,
      id: Date.now().toString(),
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set({ guides: [newGuide, ...guides] });
    return newGuide;
  },
  
  updateGuide: (guideId, data) => {
    set((state) => ({
      guides: state.guides.map((guide) => {
        if (guide.id === guideId) {
          return {
            ...guide,
            ...data,
            updatedAt: new Date().toISOString(),
          };
        }
        return guide;
      }),
    }));
    
    // Update selected guide if it's the one being updated
    const { selectedGuide } = get();
    if (selectedGuide?.id === guideId) {
      const updated = get().getGuideById(guideId);
      if (updated) set({ selectedGuide: updated });
    }
  },
  
  deleteGuide: (guideId) => {
    set((state) => ({
      guides: state.guides.filter(g => g.id !== guideId),
    }));
    
    // Clear selected guide if it's the one being deleted
    const { selectedGuide } = get();
    if (selectedGuide?.id === guideId) {
      set({ selectedGuide: null });
    }
  },
}));
