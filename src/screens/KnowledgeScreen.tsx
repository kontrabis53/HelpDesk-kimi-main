import { useState } from 'react';
import type { KnowledgeGuide, GuideCategory } from '@/types';
import { guideCategoryLabels } from '@/types';
import { EmptyState } from '@/components/EmptyState';
import { Search, BookOpen, CheckCircle, Eye, ChevronRight, Monitor, Wifi, Printer, Cpu, HelpCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface KnowledgeScreenProps {
  guides: KnowledgeGuide[];
  guidesByCategory: {
    all: KnowledgeGuide[];
    hardware: KnowledgeGuide[];
    software: KnowledgeGuide[];
    network: KnowledgeGuide[];
    printer: KnowledgeGuide[];
    common: KnowledgeGuide[];
  };
  onGuideClick: (guide: KnowledgeGuide) => void;
  onSearch: (query: string) => void;
}

type TabType = 'all' | 'hardware' | 'software' | 'network' | 'printer' | 'common';

const tabs: { id: TabType; label: string; icon: typeof Monitor }[] = [
  { id: 'all', label: 'Все', icon: BookOpen },
  { id: 'hardware', label: 'Оборудование', icon: Cpu },
  { id: 'software', label: 'ПО', icon: Monitor },
  { id: 'network', label: 'Сеть', icon: Wifi },
  { id: 'printer', label: 'Принтеры', icon: Printer },
  { id: 'common', label: 'Общее', icon: HelpCircle },
];

const categoryIcons: Record<GuideCategory, typeof Monitor> = {
  hardware: Cpu,
  software: Monitor,
  network: Wifi,
  printer: Printer,
  common: HelpCircle,
};

const categoryColors: Record<GuideCategory, string> = {
  hardware: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  software: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  network: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  printer: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  common: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
};

export function KnowledgeScreen({ 
  guides, 
  guidesByCategory, 
  onGuideClick,
  onSearch 
}: KnowledgeScreenProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const getGuidesForTab = () => {
    return guidesByCategory[activeTab] || guides;
  };

  const displayedGuides = getGuidesForTab();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 px-4 pt-4 pb-2 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-700">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">База знаний</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Решения частых проблем</p>
        </div>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Поиск по проблеме..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 h-10 bg-slate-100 dark:bg-slate-700 border-0 focus-visible:ring-blue-500 dark:text-slate-100"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const count = guidesByCategory[tab.id]?.length;
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
                  <span className={cn(
                    'ml-0.5 text-xs',
                    isActive ? 'text-blue-100' : 'text-slate-400'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Guides List */}
      <div className="p-4 space-y-3 max-w-4xl mx-auto">
        {displayedGuides.length === 0 ? (
          <EmptyState 
            title="Нет инструкций"
            description="Инструкции появятся здесь"
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {displayedGuides.map((guide) => {
              const Icon = categoryIcons[guide.category];
              return (
                <div
                  key={guide.id}
                  onClick={() => onGuideClick(guide)}
                  className={cn(
                    'bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700',
                    'active:scale-[0.98] transition-transform duration-150 cursor-pointer'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                      categoryColors[guide.category]
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded',
                            categoryColors[guide.category]
                          )}>
                            {guideCategoryLabels[guide.category]}
                          </span>
                          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mt-1">{guide.title}</h3>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                      </div>
                      
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{guide.description}</p>
                      
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{guide.successRate}% решено</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{guide.views} просмотров</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                          <span>{guide.steps.length} шагов</span>
                        </div>
                      </div>

                      {/* Tags */}
                      {guide.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {guide.tags.slice(0, 3).map((tag) => (
                            <span 
                              key={tag} 
                              className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
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
