import { mockGuides } from '@/data/mockDocuments';
import type { KnowledgeGuide } from '@/types';

// In a real application, this would be an API client making HTTP requests
export const knowledgeService = {
  getAll: (): KnowledgeGuide[] => {
    return mockGuides;
  },

  getById: (id: string): KnowledgeGuide | undefined => {
    return mockGuides.find(guide => guide.id === id);
  },

  create: (guide: Omit<KnowledgeGuide, 'id' | 'createdAt' | 'updatedAt'>): KnowledgeGuide => {
    const newGuide = {
      ...guide,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0,
    } as KnowledgeGuide;
    
    mockGuides.push(newGuide);
    return newGuide;
  },

  update: (id: string, updates: Partial<KnowledgeGuide>): KnowledgeGuide | undefined => {
    const index = mockGuides.findIndex(g => g.id === id);
    if (index === -1) return undefined;
    
    mockGuides[index] = { ...mockGuides[index], ...updates };
    return mockGuides[index];
  },
  
  delete: (id: string): void => {
    const index = mockGuides.findIndex(g => g.id === id);
    if (index !== -1) {
      mockGuides.splice(index, 1);
    }
  },

  incrementViews: (id: string): void => {
    const guide = mockGuides.find(g => g.id === id);
    if (guide) {
      guide.views += 1;
    }
  }
};
