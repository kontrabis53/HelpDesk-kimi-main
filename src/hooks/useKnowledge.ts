import { useState, useCallback, useMemo } from 'react';
import type { KnowledgeGuide, GuideCategory } from '@/types';
import { mockGuides } from '@/data/mockDocuments';
import { currentUser } from '@/data/mock';

export function useKnowledge() {
  const [guides, setGuides] = useState<KnowledgeGuide[]>(mockGuides);
  const [filter, setFilter] = useState<{ category?: GuideCategory; search?: string }>({});

  const filteredGuides = useMemo(() => {
    return guides.filter((guide) => {
      if (filter.category && guide.category !== filter.category) return false;
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const matchesSearch = 
          guide.title.toLowerCase().includes(searchLower) ||
          guide.description.toLowerCase().includes(searchLower) ||
          guide.tags.some(tag => tag.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }
      return true;
    }).sort((a, b) => b.views - a.views);
  }, [guides, filter]);

  const guidesByCategory = useMemo(() => {
    return {
      all: filteredGuides,
      hardware: filteredGuides.filter(g => g.category === 'hardware'),
      software: filteredGuides.filter(g => g.category === 'software'),
      network: filteredGuides.filter(g => g.category === 'network'),
      printer: filteredGuides.filter(g => g.category === 'printer'),
      common: filteredGuides.filter(g => g.category === 'common'),
    };
  }, [filteredGuides]);

  const getGuideById = useCallback((id: string) => {
    return guides.find(g => g.id === id);
  }, [guides]);

  const incrementViews = useCallback((guideId: string) => {
    setGuides(prev => prev.map(guide => {
      if (guide.id === guideId) {
        return { ...guide, views: guide.views + 1 };
      }
      return guide;
    }));
  }, []);

  const createGuide = useCallback((data: {
    title: string;
    category: GuideCategory;
    description: string;
    tags: string[];
    steps: { title: string; description: string }[];
  }) => {
    const newGuide: KnowledgeGuide = {
      id: Date.now().toString(),
      title: data.title,
      category: data.category,
      description: data.description,
      tags: data.tags,
      steps: data.steps.map((step, index) => ({
        id: String(index + 1),
        order: index + 1,
        title: step.title,
        description: step.description,
      })),
      successRate: 0,
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: currentUser,
    };
    setGuides(prev => [newGuide, ...prev]);
    return newGuide;
  }, []);

  return {
    guides: filteredGuides,
    guidesByCategory,
    filter,
    setFilter,
    getGuideById,
    incrementViews,
    createGuide,
  };
}
