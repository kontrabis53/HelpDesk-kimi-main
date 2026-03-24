import { useState } from 'react';
import type { KBArticle, KBArticleCategory } from '@/types';
import { EmptyState } from '@/components/EmptyState';
import { Search, BookOpen, CheckCircle, Eye, ChevronRight, Monitor, Wifi, Printer, HelpCircle, Plus, ShieldCheck, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface KnowledgeScreenProps {
  articles: KBArticle[];
  articlesByCategory: {
    all: KBArticle[];
    software: KBArticle[];
    network: KBArticle[];
    printer: KBArticle[];
    common: KBArticle[];
    security: KBArticle[];
  };
  onArticleClick: (article: KBArticle) => void;
  onSearch: (query: string) => void;
  onCreateClick?: () => void;
}

type TabType = 'all' | 'software' | 'network' | 'printer' | 'common' | 'security';

const tabs: { id: TabType; label: string; icon: any }[] = [
  { id: 'all', label: 'Все', icon: BookOpen },
  { id: 'software', label: 'ПО', icon: Monitor },
  { id: 'network', label: 'Сеть', icon: Wifi },
  { id: 'printer', label: 'Принтеры', icon: Printer },
  { id: 'security', label: 'Безопасность', icon: ShieldCheck },
  { id: 'common', label: 'Общее', icon: HelpCircle },
];

const categoryIcons: Record<KBArticleCategory, any> = {
  software: Monitor,
  network: Wifi,
  printer: Printer,
  security: ShieldCheck,
  common: HelpCircle,
};

const categoryLabels: Record<KBArticleCategory, string> = {
  software: 'ПО',
  network: 'Сеть',
  printer: 'Принтеры',
  security: 'Безопасность',
  common: 'Общее',
};

const categoryColors: Record<KBArticleCategory, string> = {
  software: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  network: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  printer: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  security: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  common: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
};

export function KnowledgeScreen({ 
  articles, 
  articlesByCategory, 
  onArticleClick,
  onSearch,
  onCreateClick
}: KnowledgeScreenProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const displayedArticles = articlesByCategory[activeTab] || articles;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 px-4 pt-4 pb-2 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">База знаний</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Полезные статьи и FAQ</p>
          </div>
          {onCreateClick && (
            <Button onClick={onCreateClick} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-1" />
              Создать
            </Button>
          )}
        </div>
        
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Поиск по статьям..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 pr-10 h-10 bg-slate-100 dark:bg-slate-700 border-0 focus-visible:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-1 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const count = articlesByCategory[tab.id]?.length;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {count !== undefined && count > 0 && (
                  <span className={cn('ml-0.5 text-xs', isActive ? 'text-blue-100' : 'text-slate-400')}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 mx-auto">
        {displayedArticles.length === 0 ? (
          <EmptyState title="Статьи не найдены" description="Попробуйте изменить категорию или поисковый запрос" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {displayedArticles.map((article) => {
              const Icon = categoryIcons[article.category];
              return (
                <div
                  key={article.id}
                  onClick={() => onArticleClick(article)}
                  className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-[0.98] transition-transform duration-150 cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', categoryColors[article.category])}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider', categoryColors[article.category])}>
                            {categoryLabels[article.category]}
                          </span>
                          <h3 className="font-bold text-slate-800 dark:text-slate-100 mt-1 leading-tight">{article.title}</h3>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{article.description}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Eye className="w-3 h-3" />
                          <span>{article.views}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                          <CheckCircle className="w-3 h-3" />
                          <span>{article.successRate}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
