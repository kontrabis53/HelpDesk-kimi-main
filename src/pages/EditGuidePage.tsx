import { useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { EditGuideScreen } from '@/screens/EditGuideScreen';
import { useKnowledgeStore } from '@/stores/knowledgeStore';
import { toast } from 'sonner';

export function EditGuidePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const selectedGuide = useKnowledgeStore((state) => state.selectedGuide);
  const getGuideById = useKnowledgeStore((state) => state.getGuideById);
  const setSelectedGuide = useKnowledgeStore((state) => state.setSelectedGuide);
  const updateGuide = useKnowledgeStore((state) => state.updateGuide);
  const deleteGuide = useKnowledgeStore((state) => state.deleteGuide);
  
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
    navigate(`/knowledge/${id}`);
  };
  
  const handleSubmit = (data: any) => {
    updateGuide(selectedGuide.id, data);
    toast.success('Инструкция обновлена');
    navigate(`/knowledge/${selectedGuide.id}`);
  };

  const handleDelete = () => {
    if (confirm('Вы уверены, что хотите удалить эту инструкцию?')) {
      deleteGuide(selectedGuide.id);
      toast.success('Инструкция удалена');
      navigate('/knowledge');
    }
  };
  
  return (
    <EditGuideScreen
      guide={selectedGuide}
      onBack={handleBack}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
    />
  );
}
