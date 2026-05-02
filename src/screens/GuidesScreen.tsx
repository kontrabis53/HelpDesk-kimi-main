import { useState, useMemo } from 'react';
import type { TechnicalGuide } from '@/types';
import { EmptyState } from '@/components/EmptyState';
import { Search, FileText, ExternalLink, Book, Download, Layers, Info, X, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useRoleStore } from '@/stores/roleStore';

interface GuidesScreenProps {
  guides: TechnicalGuide[];
  onGuideClick: (guide: TechnicalGuide) => void;
  onSearch: (query: string) => void;
  onAddGuide?: () => void;
  onDeleteGuide?: (id: string) => void;
}

export function GuidesScreen({ 
  guides, 
  onGuideClick,
  onSearch,
  onAddGuide,
  onDeleteGuide
}: GuidesScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const hasPermission = useRoleStore((state) => state.hasPermission);

  const canCreate = hasPermission('guides', 'create');
  const canDelete = hasPermission('guides', 'delete');

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const filteredGuides = useMemo(() => {
    return guides;
  }, [guides]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 md:pb-8 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 px-6 py-6 border-b border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="max-w-[1400px] mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Book className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Инструкции к оборудованию</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Техническая документация, PDF-руководства и мануалы</p>
              </div>
            </div>

            {canCreate && (
              <Button onClick={onAddGuide} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
                <Plus className="w-4 h-4 mr-2" />
                Добавить инструкцию
              </Button>
            )}
          </div>
          
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Поиск по названию оборудования, модели или ключевым словам..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-12 pr-12 h-12 bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus-visible:ring-blue-500 text-lg rounded-xl"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto w-full">
          {filteredGuides.length === 0 ? (
            <EmptyState 
              title="Инструкции не найдены"
              description="Попробуйте изменить параметры поиска или добавить новые документы в базу"
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredGuides.map((guide) => (
                <div
                  key={guide.id}
                  className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300 overflow-hidden flex flex-col"
                >
                  {/* Card Header */}
                  <div className="p-5 border-b border-slate-50 dark:border-slate-700/50 bg-slate-50/30 dark:bg-slate-900/20">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-none font-bold text-[10px] uppercase tracking-wider">
                            Тех. инструкция
                          </Badge>
                          {guide.equipmentModels && guide.equipmentModels.length > 0 && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                              <Layers className="w-3 h-3" />
                              {guide.equipmentModels[0]}
                            </div>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                          {guide.title}
                        </h3>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 flex items-center justify-center shadow-sm">
                          <FileText className="w-5 h-5 text-blue-500" />
                        </div>
                        {canDelete && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onDeleteGuide) onDeleteGuide(guide.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                      {guide.description}
                    </p>
                  </div>

                  {/* Card Body - Files */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Прикрепленные файлы</div>
                    <div className="space-y-2 flex-1">
                      {guide.fileUrls && guide.fileUrls.length > 0 ? (
                        guide.fileUrls.map((file, idx) => (
                          <div 
                            key={idx}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all cursor-pointer group/file"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                file.type === 'pdf' ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"
                              )}>
                                <Download className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                                {file.name}
                              </span>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover/file:text-blue-500 transition-colors" />
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center gap-2 p-3 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-dashed border-amber-200 dark:border-amber-800">
                          <Info className="w-4 h-4 text-amber-500" />
                          <span className="text-xs text-amber-600 dark:text-amber-400">Файлы еще не загружены</span>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-6 flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 h-10 rounded-xl text-xs font-bold border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                        onClick={() => onGuideClick(guide)}
                      >
                        Открыть шаги
                      </Button>
                      <Button 
                        className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-500/20"
                        onClick={() => onGuideClick(guide)}
                      >
                        Читать всё
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
