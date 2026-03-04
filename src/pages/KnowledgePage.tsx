import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { KnowledgeScreen } from '@/screens/KnowledgeScreen';
import { useKnowledgeStore } from '@/stores/knowledgeStore';

export function KnowledgePage() {
  const navigate = useNavigate();
  
  const allGuides = useKnowledgeStore((state) => state.guides);
  const filter = useKnowledgeStore((state) => state.filter);
  const setFilter = useKnowledgeStore((state) => state.setFilter);
  const setSelectedGuide = useKnowledgeStore((state) => state.setSelectedGuide);
  const incrementViews = useKnowledgeStore((state) => state.incrementViews);

  const guides = useMemo(() => {
    return allGuides.filter((guide) => {
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
  }, [allGuides, filter]);

  const guidesByCategory = useMemo(() => {
    return {
      all: guides,
      hardware: guides.filter(g => g.category === 'hardware'),
      software: guides.filter(g => g.category === 'software'),
      network: guides.filter(g => g.category === 'network'),
      printer: guides.filter(g => g.category === 'printer'),
      common: guides.filter(g => g.category === 'common'),
    };
  }, [guides]);
  
  const handleGuideClick = (guide: any) => {
    setSelectedGuide(guide);
    incrementViews(guide.id);
    navigate(`/knowledge/${guide.id}`);
  };
  
  const handleSearch = (query: string) => {
    setFilter({ search: query });
  };
  
  return (
    <KnowledgeScreen
      guides={guides}
      guidesByCategory={guidesByCategory}
      onGuideClick={handleGuideClick}
      onSearch={handleSearch}
    />
  );
}
