import { useState } from 'react';
import type { Document, DocumentType } from '@/types';
import { documentStatusLabels } from '@/types';
import { EmptyState } from '@/components/EmptyState';
import { Search, FileText, Calendar, MapPin, Wrench, Package, ClipboardList, List, LayoutGrid } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CalendarView } from '@/components/documents/CalendarView';

interface DocumentsScreenProps {
  documents: Document[];
  documentsByType: {
    all: Document[];
    act: Document[];
    repair: Document[];
    maintenance: Document[];
    inventory: Document[];
  };
  onDocumentClick: (doc: Document) => void;
  onCreateClick: () => void;
  onSearch: (query: string) => void;
}

type TabType = 'all' | 'act' | 'repair' | 'maintenance' | 'inventory';
type ViewType = 'list' | 'calendar' | 'grid';

const tabs: { id: TabType; label: string; icon: typeof FileText }[] = [
  { id: 'all', label: 'Все', icon: FileText },
  { id: 'act', label: 'Акты', icon: ClipboardList },
  { id: 'repair', label: 'Ремонты', icon: Wrench },
  { id: 'maintenance', label: 'ТО', icon: Calendar },
  { id: 'inventory', label: 'Инвентарь', icon: Package },
];

const typeIcons: Record<DocumentType, typeof FileText> = {
  act: ClipboardList,
  repair: Wrench,
  maintenance: Calendar,
  inventory: Package,
  other: FileText,
};

const typeColors: Record<DocumentType, string> = {
  act: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  repair: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  maintenance: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  inventory: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  other: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
};

export function DocumentsScreen({ 
  documents, 
  documentsByType, 
  onDocumentClick,
  onCreateClick,
  onSearch 
}: DocumentsScreenProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewType, setViewType] = useState<ViewType>('calendar');

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const getDocumentsForTab = () => {
    return documentsByType[activeTab] || documents;
  };

  const displayedDocuments = getDocumentsForTab();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 px-4 pt-3 pb-1 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Документы</h1>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewType('list')}
                className={cn(
                  "p-1 rounded-md transition-all",
                  viewType === 'list' 
                    ? "bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-400" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
                title="Список"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewType('grid')}
                className={cn(
                  "p-1 rounded-md transition-all",
                  viewType === 'grid' 
                    ? "bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-400" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
                title="Карточки"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewType('calendar')}
                className={cn(
                  "p-1 rounded-md transition-all",
                  viewType === 'calendar' 
                    ? "bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-400" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
                title="Календарь"
              >
                <Calendar className="w-3.5 h-3.5" />
              </button>
            </div>
            <Button onClick={onCreateClick} size="sm" className="bg-blue-600 hover:bg-blue-700 h-8 text-xs px-3">
              + Новый
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Поиск по номеру или названию..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 h-9 bg-slate-100 dark:bg-slate-700 border-0 focus-visible:ring-blue-500 dark:text-slate-100 text-sm"
          />
          {searchQuery && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                Найдено: {documents.length}
              </span>
              <button 
                onClick={() => handleSearch('')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <span className="text-xs">✕</span>
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide mb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-1 md:p-2 w-full flex-1 overflow-hidden pb-16 md:pb-4">
        <div className={cn(
          "flex flex-col gap-2 h-full",
          viewType === 'calendar' && searchQuery && "lg:flex-row"
        )}>
          {/* Main Content Area */}
          <div className={cn(
            "flex-1 min-w-0 h-full",
            viewType === 'calendar' && searchQuery && "lg:w-2/3"
          )}>
            {viewType === 'list' ? (
              displayedDocuments.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="Нет документов"
                  description={searchQuery ? 'По вашему запросу ничего не найдено' : 'В этом разделе пока нет документов'}
                />
              ) : (
                <div className="space-y-3">
                  {displayedDocuments.map((doc) => {
                    const TypeIcon = typeIcons[doc.type];
                    return (
                      <div
                        key={doc.id}
                        onClick={() => onDocumentClick(doc)}
                        className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all active:scale-[0.99] cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", typeColors[doc.type])}>
                              <TypeIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                  {doc.number}
                                </span>
                                <span className={cn(
                                  "text-xs px-2 py-0.5 rounded-full border",
                                  doc.status === 'active' ? "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:border-green-800" :
                                  doc.status === 'draft' ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800" :
                                  "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                                )}>
                                  {documentStatusLabels[doc.status]}
                                </span>
                              </div>
                              <h3 className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1">{doc.title}</h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{doc.description}</p>
                              
                              <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(doc.createdAt)}
                                </div>
                                {doc.equipmentLocation && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {doc.equipmentLocation}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : viewType === 'grid' ? (
              displayedDocuments.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="Нет документов"
                  description={searchQuery ? 'По вашему запросу ничего не найдено' : 'В этом разделе пока нет документов'}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedDocuments.map((doc) => {
                    const TypeIcon = typeIcons[doc.type];
                    return (
                      <div
                        key={doc.id}
                        onClick={() => onDocumentClick(doc)}
                        className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer flex flex-col h-full"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", typeColors[doc.type])}>
                            <TypeIcon className="w-6 h-6" />
                          </div>
                          <span className={cn(
                            "text-xs px-2.5 py-1 rounded-full border font-medium",
                            doc.status === 'active' ? "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:border-green-800" :
                            doc.status === 'draft' ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800" :
                            "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                          )}>
                            {documentStatusLabels[doc.status]}
                          </span>
                        </div>
                        <div className="mb-4 flex-1">
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                            {doc.number}
                          </span>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 line-clamp-2">{doc.title}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3">{doc.description}</p>
                        </div>
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(doc.createdAt)}
                          </div>
                          {doc.equipmentLocation && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[100px]">{doc.equipmentLocation}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <CalendarView 
                documents={displayedDocuments} 
                onDocumentClick={onDocumentClick} 
                highlightSearch={!!searchQuery}
              />
            )}
          </div>

          {/* Search Results Sidebar (only for Calendar view with search) */}
          {viewType === 'calendar' && searchQuery && (
            <div className="lg:w-1/3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col max-h-[calc(100vh-250px)]">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-blue-50/50 dark:bg-blue-900/10">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Результаты поиска</h3>
                </div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {displayedDocuments.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {displayedDocuments.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <p className="text-sm">Ничего не найдено</p>
                  </div>
                ) : (
                  displayedDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => onDocumentClick(doc)}
                      className="p-3 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500">
                          {doc.number}
                        </span>
                        <span className="text-[10px] text-slate-400">{formatDate(doc.createdAt)}</span>
                      </div>
                      <h4 className="text-sm font-medium text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {doc.title}
                      </h4>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
