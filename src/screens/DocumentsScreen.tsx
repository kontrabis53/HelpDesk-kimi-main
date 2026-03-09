import { useState, useMemo, useEffect } from 'react';
import type { Document, DocumentType } from '@/types';
import { documentStatusLabels } from '@/types';
import { EmptyState } from '@/components/EmptyState';
import { 
  Search, 
  FileText, 
  Calendar as CalendarIcon, 
  MapPin, 
  Wrench, 
  Package, 
  ClipboardList, 
  List, 
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { CalendarView } from '@/components/documents/CalendarView';
import { 
  format, 
  addMonths, 
  subMonths, 
  setMonth, 
  setYear, 
  getYear,
  parseISO
} from 'date-fns';
import { ru } from 'date-fns/locale';

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
  { id: 'maintenance', label: 'ТО', icon: CalendarIcon },
  { id: 'inventory', label: 'Инвентарь', icon: Package },
];

const typeIcons: Record<DocumentType, typeof FileText> = {
  act: ClipboardList,
  repair: Wrench,
  maintenance: CalendarIcon,
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
  
  // Use localStorage to persist viewType
  const [viewType, setViewType] = useState<ViewType>(() => {
    return (localStorage.getItem('documentsViewType') as ViewType) || 'calendar';
  });

  useEffect(() => {
    localStorage.setItem('documentsViewType', viewType);
  }, [viewType]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerView, setPickerView] = useState<'days' | 'months' | 'years'>('days');

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
    if (!value) setSelectedDocId(null);
  };

  const getDocumentsForTab = () => {
    const tabDocs = documentsByType[activeTab] || documents;
    
    // Filter by selected month/year from the calendar navigation
    return tabDocs.filter(doc => {
      const docDate = parseISO(doc.createdAt);
      return docDate.getMonth() === currentDate.getMonth() && 
             docDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const displayedDocuments = getDocumentsForTab();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Calendar navigation logic
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => {
    setCurrentDate(new Date());
    setPickerView('days');
  };

  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentDate(setMonth(currentDate, monthIndex));
    setPickerView('days');
  };

  const handleYearSelect = (year: number) => {
    setCurrentDate(setYear(currentDate, year));
    setPickerView('months');
  };

  const handleYearChange = (offset: number) => {
    setCurrentDate(setYear(currentDate, getYear(currentDate) + offset));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setCurrentDate(date);
      setIsDatePickerOpen(false);
      setPickerView('days');
    }
  };

  const years = useMemo(() => {
    const currentYear = getYear(currentDate);
    const startYear = Math.floor(currentYear / 12) * 12;
    return Array.from({ length: 12 }, (_, i) => startYear + i);
  }, [currentDate]);

  const handlePickerHeaderClick = () => {
    if (pickerView === 'days') setPickerView('months');
    else if (pickerView === 'months') setPickerView('years');
    else setPickerView('days');
  };

  const handleSearchResultClick = (doc: Document) => {
    setSelectedDocId(doc.id);
    const docDate = parseISO(doc.createdAt);
    const isSameDay = 
      docDate.getDate() === currentDate.getDate() &&
      docDate.getMonth() === currentDate.getMonth() &&
      docDate.getFullYear() === currentDate.getFullYear();

    if (isSameDay) {
      // If already on this date, open the document
      onDocumentClick(doc);
    } else {
      // If different date, just jump to it first
      setCurrentDate(docDate);
    }
  };

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 px-4 pt-4 pb-2 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Документы</h1>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewType('list')}
                className={cn(
                  "p-1.5 rounded-md transition-all flex items-center justify-center",
                  viewType === 'list' 
                    ? "bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-400" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
                title="Список"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewType('grid')}
                className={cn(
                  "p-1.5 rounded-md transition-all flex items-center justify-center",
                  viewType === 'grid' 
                    ? "bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-400" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
                title="Карточки"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewType('calendar')}
                className={cn(
                  "p-1.5 rounded-md transition-all flex items-center justify-center",
                  viewType === 'calendar' 
                    ? "bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-400" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
                title="Календарь"
              >
                <CalendarIcon className="w-4 h-4" />
              </button>
            </div>
            <Button onClick={onCreateClick} size="sm" className="bg-blue-600 hover:bg-blue-700 h-9 px-4">
              + Новый
            </Button>
          </div>
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

        {/* Tabs and Calendar Nav Row */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Calendar Navigation */}
          <div className="flex items-center gap-2 ml-4 mb-2">
            <Popover open={isDatePickerOpen} onOpenChange={(open) => {
              setIsDatePickerOpen(open);
              if (open) setPickerView('days');
            }}>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 capitalize px-3 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1 h-10"
                >
                  {format(currentDate, 'LLLL yyyy', { locale: ru })}
                  <ChevronDown className={cn("h-5 w-5 transition-transform text-slate-400", isDatePickerOpen && "rotate-180")} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-4 min-w-[320px]">
                  <div className="flex items-center justify-between mb-4">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                      if (pickerView === 'days') prevMonth();
                      else if (pickerView === 'months') handleYearChange(-1);
                      else handleYearChange(-12);
                    }}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      className="font-bold text-sm capitalize px-4 hover:bg-slate-100 dark:hover:bg-slate-700 flex-1"
                      onClick={handlePickerHeaderClick}
                    >
                      {pickerView === 'days' && format(currentDate, 'LLLL yyyy', { locale: ru })}
                      {pickerView === 'months' && format(currentDate, 'yyyy', { locale: ru })}
                      {pickerView === 'years' && `${years[0]} - ${years[years.length - 1]}`}
                    </Button>

                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                      if (pickerView === 'days') nextMonth();
                      else if (pickerView === 'months') handleYearChange(1);
                      else handleYearChange(12);
                    }}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {pickerView === 'days' && (
                    <Calendar
                      mode="single"
                      selected={currentDate}
                      onSelect={handleDateSelect}
                      initialFocus
                      locale={ru}
                      className="p-0"
                      classNames={{
                        month_caption: "hidden",
                        nav: "hidden",
                      }}
                    />
                  )}

                  {pickerView === 'months' && (
                    <div className="grid grid-cols-3 gap-2">
                      {months.map((month, index) => (
                        <Button
                          key={month}
                          variant="ghost"
                          className={cn(
                            "h-10 text-xs",
                            currentDate.getMonth() === index && "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                          )}
                          onClick={() => handleMonthSelect(index)}
                        >
                          {month.substring(0, 3)}
                        </Button>
                      ))}
                    </div>
                  )}

                  {pickerView === 'years' && (
                    <div className="grid grid-cols-3 gap-2">
                      {years.map((year) => (
                        <Button
                          key={year}
                          variant="ghost"
                          className={cn(
                            "h-10 text-xs",
                            getYear(currentDate) === year && "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                          )}
                          onClick={() => handleYearSelect(year)}
                        >
                          {year}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={prevMonth}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="h-9 text-base px-4 font-bold" onClick={goToToday}>
                Сегодня
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={nextMonth}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-0 w-full flex-1 overflow-hidden">
        <div className={cn(
          "flex flex-col h-full",
          viewType === 'calendar' && searchQuery && "lg:flex-row"
        )}>
          {/* Main Content Area */}
          <div className={cn(
            "flex-1 min-w-0 h-full flex flex-col",
            viewType === 'calendar' && searchQuery && "lg:w-2/3"
          )}>
            {viewType === 'list' ? (
              displayedDocuments.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    icon={FileText}
                    title="Нет документов"
                    description={searchQuery ? 'По вашему запросу ничего не найдено' : 'В этом разделе пока нет документов'}
                  />
                </div>
              ) : (
                <div className="p-4 space-y-3 overflow-y-auto h-full pb-20">
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
                                  <CalendarIcon className="w-3 h-3" />
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
                <div className="p-4">
                  <EmptyState
                    icon={FileText}
                    title="Нет документов"
                    description={searchQuery ? 'По вашему запросу ничего не найдено' : 'В этом разделе пока нет документов'}
                  />
                </div>
              ) : (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-y-auto h-full pb-20">
                  {displayedDocuments.map((doc) => {
                    const TypeIcon = typeIcons[doc.type];
                    return (
                      <div
                        key={doc.id}
                        onClick={() => onDocumentClick(doc)}
                        className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer flex flex-col h-full"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", typeColors[doc.type])}>
                            <TypeIcon className="w-5 h-5" />
                          </div>
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full border font-medium",
                            doc.status === 'active' ? "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:border-green-800" :
                            doc.status === 'draft' ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800" :
                            "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                          )}>
                            {documentStatusLabels[doc.status]}
                          </span>
                        </div>
                        <div className="mb-3 flex-1 min-w-0">
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5 block">
                            {doc.number}
                          </span>
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1 line-clamp-2 leading-tight">{doc.title}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{doc.description}</p>
                        </div>
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[10px] text-slate-400">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            {formatDate(doc.createdAt)}
                          </div>
                          {doc.equipmentLocation && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate max-w-[70px]">{doc.equipmentLocation}</span>
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
                currentDate={currentDate}
                selectedDocId={selectedDocId}
              />
            )}
          </div>

          {/* Search Results Sidebar (only for Calendar view with search) */}
          {viewType === 'calendar' && searchQuery && (
            <div className="lg:w-1/3 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-blue-50/50 dark:bg-blue-900/10">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Результаты поиска</h3>
                </div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {displayedDocuments.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 pb-20">
                {displayedDocuments.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <p className="text-sm">Ничего не найдено</p>
                  </div>
                ) : (
                  displayedDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => handleSearchResultClick(doc)}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-all group relative",
                        selectedDocId === doc.id 
                          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm" 
                          : "border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      )}
                    >
                      {selectedDocId === doc.id && (
                        <div className="absolute -left-1 -top-1 bg-green-500 text-white rounded-full p-0.5 shadow-sm z-10">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn(
                          "text-[10px] font-medium px-1.5 py-0.5 rounded",
                          selectedDocId === doc.id 
                            ? "bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300" 
                            : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                        )}>
                          {doc.number}
                        </span>
                        <span className="text-[10px] text-slate-400">{formatDate(doc.createdAt)}</span>
                      </div>
                      <h4 className={cn(
                        "text-sm font-medium line-clamp-1",
                        selectedDocId === doc.id 
                          ? "text-blue-700 dark:text-blue-300" 
                          : "text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                      )}>
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
