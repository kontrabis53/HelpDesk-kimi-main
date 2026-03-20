import { useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { EditGuideScreen } from '@/screens/EditGuideScreen';
import { useKnowledgeStore } from '@/stores/knowledgeStore';
import { toast } from 'sonner';

export function EditGuidePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const selectedArticle = useKnowledgeStore((state) => state.selectedArticle);
  const getArticleById = useKnowledgeStore((state) => state.getArticleById);
  const setSelectedArticle = useKnowledgeStore((state) => state.setSelectedArticle);
  const updateArticle = useKnowledgeStore((state) => state.updateArticle);
  const deleteArticle = useKnowledgeStore((state) => state.deleteArticle);
  
  useEffect(() => {
    if (id) {
      const article = getArticleById(id);
      if (article) {
        setSelectedArticle(article);
      } else {
        toast.error('Статья не найдена');
        navigate('/knowledge');
      }
    }
  }, [id, getArticleById, setSelectedArticle, navigate]);
  
  if (!selectedArticle) {
    return null;
  }
  
  const handleBack = () => {
    navigate(`/knowledge/${id}`);
  };
  
  const handleSubmit = (data: any) => {
    if (id) {
      updateArticle(id, data);
      toast.success('Статья обновлена');
      navigate(`/knowledge/${id}`);
    }
  };

  const handleDelete = () => {
    if (id && window.confirm('Вы уверены, что хотите удалить эту статью?')) {
      deleteArticle(id);
      toast.success('Статья удалена');
      navigate('/knowledge');
    }
  };
  
  return (
    <EditGuideScreen
      article={selectedArticle}
      onBack={handleBack}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
    />
  );
}
