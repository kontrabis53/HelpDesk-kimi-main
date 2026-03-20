import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { GuideDetailScreen } from '@/screens/GuideDetailScreen';
import { useKnowledgeStore } from '@/stores/knowledgeStore';
import { toast } from 'sonner';

export function GuideDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const selectedArticle = useKnowledgeStore((state) => state.selectedArticle);
  const getArticleById = useKnowledgeStore((state) => state.getArticleById);
  const setSelectedArticle = useKnowledgeStore((state) => state.setSelectedArticle);
  const incrementViews = useKnowledgeStore((state) => state.incrementViews);
  
  useEffect(() => {
    if (id) {
      const article = getArticleById(id);
      if (article) {
        setSelectedArticle(article);
        incrementViews(article.id);
      } else {
        toast.error('Статья не найдена');
        navigate('/knowledge');
      }
    }
  }, [id, getArticleById, setSelectedArticle, incrementViews, navigate]);
  
  if (!selectedArticle) {
    return null;
  }
  
  const handleBack = () => {
    navigate('/knowledge');
  };
  
  const handleEdit = () => {
    navigate(`/knowledge/${id}/edit`);
  };

  return (
    <GuideDetailScreen
      article={selectedArticle}
      onBack={handleBack}
      onEdit={handleEdit}
    />
  );
}
