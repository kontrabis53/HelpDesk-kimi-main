import { useNavigate } from 'react-router-dom';
import { useMemo, useEffect } from 'react';
import { KnowledgeScreen } from '@/screens/KnowledgeScreen';
import { useKnowledgeStore } from '@/stores/knowledgeStore';
import { useRoleStore } from '@/stores/roleStore';
import { toast } from 'sonner';
import type { KBArticle } from '@/types';

export function KnowledgePage() {
  const navigate = useNavigate();
  
  const allArticles = useKnowledgeStore((state) => state.articles);
  const fetchArticles = useKnowledgeStore((state) => state.fetchArticles);
  const incrementViews = useKnowledgeStore((state) => state.incrementViews);
  const filter = useKnowledgeStore((state) => state.filter);
  const setFilter = useKnowledgeStore((state) => state.setFilter);
  const setSelectedArticle = useKnowledgeStore((state) => state.setSelectedArticle);
  const hasPermission = useRoleStore((state) => state.hasPermission);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const articles = useMemo(() => {
    return allArticles.filter((article) => {
      if (filter.category && article.category !== filter.category) return false;
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const matchesSearch =
          article.title.toLowerCase().includes(searchLower) ||
          article.content.toLowerCase().includes(searchLower) ||
          article.tags.some(tag => tag.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }
      return true;
    }).sort((a, b) => b.views - a.views);
  }, [allArticles, filter]);

  const articlesByCategory = useMemo(() => {
    return {
      all: articles,
      software: articles.filter(a => a.category === 'software'),
      network: articles.filter(a => a.category === 'network'),
      printer: articles.filter(a => a.category === 'printer'),
      common: articles.filter(a => a.category === 'common'),
      security: articles.filter(a => a.category === 'security'),
    };
  }, [articles]);
  
  const handleArticleClick = (article: KBArticle) => {
    setSelectedArticle(article);
    incrementViews(article.id);
    navigate(`/knowledge/${article.id}`);
  };
  
  const handleSearch = (query: string) => {
    setFilter({ search: query });
  };

  const handleCreateClick = () => {
    if (!hasPermission('knowledge', 'create')) {
      toast.error('Нет прав', { description: 'У вас нет прав для создания статей' });
      return;
    }
    navigate('/knowledge/create');
  };
  
  return (
    <KnowledgeScreen
      articles={articles}
      articlesByCategory={articlesByCategory}
      onArticleClick={handleArticleClick}
      onSearch={handleSearch}
      onCreateClick={handleCreateClick}
    />
  );
}
