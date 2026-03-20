import { useState, useMemo } from 'react';
import { GuidesScreen } from '@/screens/GuidesScreen';
import { useGuideStore } from '@/stores/guideStore';
import type { TechnicalGuide } from '@/types';
import { toast } from 'sonner';

export function GuidesPage() {
  const allGuides = useGuideStore((state) => state.guides);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGuides = useMemo(() => {
    if (!searchQuery) return allGuides;
    
    const searchLower = searchQuery.toLowerCase();
    return allGuides.filter((guide) =>
      guide.title.toLowerCase().includes(searchLower) ||
      guide.description.toLowerCase().includes(searchLower) ||
      guide.equipmentModels.some(m => m.toLowerCase().includes(searchLower))
    );
  }, [allGuides, searchQuery]);
  
  const handleGuideClick = (guide: TechnicalGuide) => {
    // For now just open the first file or show details
    if (guide.fileUrls && guide.fileUrls.length > 0) {
      toast.info(`Открытие: ${guide.fileUrls[0].name}`);
    }
  };
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  return (
    <GuidesScreen
      guides={filteredGuides}
      onGuideClick={handleGuideClick}
      onSearch={handleSearch}
    />
  );
}
