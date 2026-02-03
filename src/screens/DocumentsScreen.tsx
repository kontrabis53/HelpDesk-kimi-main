import { useState } from 'react';
import type { Document, DocumentType } from '@/types';
import { documentStatusLabels } from '@/types';
import { EmptyState } from '@/components/EmptyState';
import { Search, FileText, Calendar, MapPin, Wrench, Package, ClipboardList } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 px-4 pt-4 pb-2 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Документы</h1>
          <Button onClick={onCreateClick} size="sm" className="bg-blue-600 hover:bg-blue-700">
            + Новый
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Поиск по номеру или названию..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 h-10 bg-slate-100 dark:bg-slate-700 border-0 focus-visible:ring-blue-500 dark:text-slate-100"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const count = documentsByType[tab.id]?.length;
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

      {/* Documents List */}
      <div className="p-4 space-y-3 max-w-4xl mx-auto">
        {displayedDocuments.length === 0 ? (
          <EmptyState 
            title="Нет документов"
            description="Создайте первый документ"
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {displayedDocuments.map((doc) => {
              const Icon = typeIcons[doc.type];
              return (
                <div
                  key={doc.id}
                  onClick={() => onDocumentClick(doc)}
                  className={cn(
                    'bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700',
                    'active:scale-[0.98] transition-transform duration-150 cursor-pointer'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                      typeColors[doc.type]
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs text-slate-400 dark:text-slate-500">{doc.number}</span>
                          <h3 className="font-semibold text-slate-800 dark:text-slate-100 line-clamp-1">{doc.title}</h3>
                        </div>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full flex-shrink-0',
                          doc.status === 'active' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          doc.status === 'draft' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                        )}>
                          {documentStatusLabels[doc.status]}
                        </span>
                      </div>
                      
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{doc.description}</p>
                      
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 dark:text-slate-500">
                        <span>{formatDate(doc.createdAt)}</span>
                        {doc.equipmentName && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {doc.equipmentLocation}
                          </span>
                        )}
                        {doc.repairCost && doc.repairCost > 0 && (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            {doc.repairCost.toLocaleString()} ₽
                          </span>
                        )}
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
