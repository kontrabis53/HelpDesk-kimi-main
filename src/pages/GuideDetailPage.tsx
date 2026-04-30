import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { GuideDetailScreen } from '@/screens/GuideDetailScreen';
import { useKnowledgeStore } from '@/stores/knowledgeStore';
import { useTicketStore } from '@/stores/ticketStore';
import { toast } from 'sonner';

export function GuideDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const selectedArticle = useKnowledgeStore((state) => state.selectedArticle);
  const getArticleById = useKnowledgeStore((state) => state.getArticleById);
  const incrementViews = useKnowledgeStore((state) => state.incrementViews);
  const setSelectedArticle = useKnowledgeStore((state) => state.setSelectedArticle);
  const createArticle = useTicketStore((state) => state.createTicket);
  
  useEffect(() => {
    async function loadArticle() {
      if (id) {
        setLoading(true);
        const article = await getArticleById(id);
        if (article) {
          setSelectedArticle(article);
          // Only update UI count, server was updated by getArticleById
          incrementViews(id);
        } else {
          toast.error('Статья не найдена');
          navigate('/knowledge');
        }
        setLoading(false);
      }
    }
    loadArticle();
  }, [id, getArticleById, setSelectedArticle, incrementViews, navigate]);

  const handleCreateTicket = async () => {
    if (!selectedArticle) return;
    try {
      const ticketData = {
        title: `Проблема по инструкции: ${selectedArticle.title}`,
        description: `Пользователь не смог решить проблему с помощью инструкции "${selectedArticle.title}".\n\nОписание инструкции: ${selectedArticle.description}`,
        category: selectedArticle.category as any,
        priority: 'medium' as const,
      };
      const newTicket = await createArticle(ticketData);
      toast.success('Заявка создана', {
        description: `Заявка ${newTicket.number} успешно создана`,
      });
      navigate('/tickets');
    } catch (error) {
      toast.error('Ошибка при создании заявки');
    }
  };
  
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
      onCreateTicket={handleCreateTicket}
    />
  );
}
