import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { GuideDetailScreen } from '@/screens/GuideDetailScreen';
import { useKnowledgeStore } from '@/stores/knowledgeStore';
import { toast } from 'sonner';

export function GuideDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const selectedGuide = useKnowledgeStore((state) => state.selectedGuide);
  const getGuideById = useKnowledgeStore((state) => state.getGuideById);
  const setSelectedGuide = useKnowledgeStore((state) => state.setSelectedGuide);
  
  useEffect(() => {
    if (id) {
      const guide = getGuideById(id);
      if (guide) {
        setSelectedGuide(guide);
      } else {
        toast.error('Инструкция не найдена');
        navigate('/knowledge');
      }
    }
  }, [id, getGuideById, setSelectedGuide, navigate]);
  
  if (!selectedGuide) {
    return null;
  }
  
  const handleBack = () => {
    navigate('/knowledge');
  };
  
  const handleCreateTicket = () => {
    navigate('/tickets/create');
  };
  
  return (
    <GuideDetailScreen
      guide={selectedGuide}
      onBack={handleBack}
      onCreateTicket={handleCreateTicket}
    />
  );
}
