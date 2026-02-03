import { useNavigate } from 'react-router-dom';
import { KnowledgeScreen } from '@/screens/KnowledgeScreen';
import { useKnowledgeStore } from '@/stores/knowledgeStore';

export function KnowledgePage() {
  const navigate = useNavigate();
  
  const guides = useKnowledgeStore((state) => state.filteredGuides());
  const guidesByCategory = useKnowledgeStore((state) => state.guidesByCategory());
  const setFilter = useKnowledgeStore((state) => state.setFilter);
  const setSelectedGuide = useKnowledgeStore((state) => state.setSelectedGuide);
  const incrementViews = useKnowledgeStore((state) => state.incrementViews);
  
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
