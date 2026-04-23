import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { GuideDetailScreen } from '@/screens/GuideDetailScreen';
import { useKnowledgeStore } from '@/stores/knowledgeStore';
import { toast } from 'sonner';

export function GuideDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const selectedArticle = useKnowledgeStore((state) => state.selectedArticle);
  const getArticleById = useKnowledgeStore((state) => state.getArticleById);
  const setSelectedArticle = useKnowledgeStore((state) => state.setSelectedArticle);
  
  useEffect(() => {
    async function loadArticle() {
      if (id) {
        setLoading(true);
        const article = await getArticleById(id);
        if (article) {
          setSelectedArticle(article);
        } else {
          toast.error('Статья не найдена');
          navigate('/knowledge');
        }
        setLoading(false);
      }
    }
    loadArticle();
  }, [id, getArticleById, setSelectedArticle, navigate]);
  
  if (loading || !selectedArticle) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
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
