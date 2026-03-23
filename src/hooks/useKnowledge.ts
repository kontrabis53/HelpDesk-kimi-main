import { useState, useCallback, useMemo } from 'react';
import type { KBArticle, KBArticleCategory } from '@/types';
import { mockKBArticles } from '@/data/mockDocuments';
import { currentUser } from '@/data/mock';

export function useKnowledge() {
  const [articles, setArticles] = useState<KBArticle[]>(mockKBArticles);
  const [filter, setFilter] = useState<{ category?: KBArticleCategory; search?: string }>({});

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      if (filter.category && article.category !== filter.category) return false;
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const matchesSearch = 
          article.title.toLowerCase().includes(searchLower) ||
          article.description.toLowerCase().includes(searchLower) ||
          article.tags.some((tag: string) => tag.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }
      return true;
    }).sort((a, b) => b.views - a.views);
  }, [articles, filter]);

  const articlesByCategory = useMemo(() => {
    return {
      all: filteredArticles,
      software: filteredArticles.filter(a => a.category === 'software'),
      network: filteredArticles.filter(a => a.category === 'network'),
      printer: filteredArticles.filter(a => a.category === 'printer'),
      common: filteredArticles.filter(a => a.category === 'common'),
      security: filteredArticles.filter(a => a.category === 'security'),
    };
  }, [filteredArticles]);

  const getArticleById = useCallback((id: string) => {
    return articles.find(a => a.id === id);
  }, [articles]);

  const incrementViews = useCallback((articleId: string) => {
    setArticles(prev => prev.map(article => {
      if (article.id === articleId) {
        return { ...article, views: article.views + 1 };
      }
      return article;
    }));
  }, []);

  const createArticle = useCallback((data: {
    title: string;
    category: KBArticleCategory;
    description: string;
    tags: string[];
    steps: { title: string; description: string }[];
  }) => {
    const newArticle: KBArticle = {
      id: Date.now().toString(),
      title: data.title,
      category: data.category,
      description: data.description,
      tags: data.tags,
      steps: data.steps.map((step, index) => ({
        id: String(index + 1),
        order: index + 1,
        title: step.title,
        description: step.description,
      })),
      successRate: 0,
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: currentUser,
    };
    setArticles(prev => [newArticle, ...prev]);
    return newArticle;
  }, []);

  return {
    articles: filteredArticles,
    articlesByCategory,
    filter,
    setFilter,
    getArticleById,
    incrementViews,
    createArticle,
  };
}
