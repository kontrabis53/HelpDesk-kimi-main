import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { EditGuideScreen } from '@/screens/EditGuideScreen';
import { useKnowledgeStore } from '@/stores/knowledgeStore';
import { toast } from 'sonner';

export function EditGuidePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const selectedArticle = useKnowledgeStore((state) => state.selectedArticle);
  const getArticleById = useKnowledgeStore((state) => state.getArticleById);
  const setSelectedArticle = useKnowledgeStore((state) => state.setSelectedArticle);
  const updateArticle = useKnowledgeStore((state) => state.updateArticle);
  const deleteArticle = useKnowledgeStore((state) => state.deleteArticle);
  
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
    navigate(`/knowledge/${id}`);
  };
  
  const handleSubmit = async (data: any) => {
    if (id) {
      await updateArticle(id, data);
      toast.success('Статья обновлена');
      navigate(`/knowledge/${id}`);
    }
  };

  const handleDelete = async () => {
    if (id && window.confirm('Вы уверены, что хотите удалить эту статью?')) {
      await deleteArticle(id);
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
