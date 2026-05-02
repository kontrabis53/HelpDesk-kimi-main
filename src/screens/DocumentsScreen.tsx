import { useState, useMemo } from 'react';
import type { Document, DocumentType } from '@/types';
import { documentStatusLabels } from '@/types';
import { EmptyState } from '@/components/EmptyState';
import { useDocumentStore } from '@/stores/documentStore';
import { 
  Search, 
  FileText, 
  Calendar as CalendarIcon, 
  MapPin, 
  Wrench, 
  Package, 
  ClipboardList, 
  List, 
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CalendarView } from '@/components/documents/CalendarView';
import { DayTimelineView } from '@/components/documents/DayTimelineView';
import { 
  format, 
  addMonths, 
  subMonths, 
  setMonth, 
  setYear, 
  getYear,
  parseISO,
  isSameDay
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
  documents = [], 
  documentsByType = {
    all: [],
    act: [],
    repair: [],
    maintenance: [],
    inventory: [],
  }, 
  onDocumentClick,
  onCreateClick,
  onSearch 
}: DocumentsScreenProps) {
  const [activeTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const viewType = useDocumentStore((state) => state.viewType);
  const setViewType = useDocumentStore((state) => state.setViewType);
  const currentDate = useDocumentStore((state) => state.currentDate);
  const setCurrentDate = useDocumentStore((state) => state.setCurrentDate);

  const handleViewTypeChange = (newType: ViewType | 'day') => {
    setViewType(newType);
  };

  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerView, setPickerView] = useState<'days' | 'months' | 'years'>('days');

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
    if (!value) setSelectedDocId(null);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) {
      handleSearch('');
    }
  };

  const [activeSearchFilters, setActiveSearchFilters] = useState<TabType[]>(['all']);

  const toggleSearchFilter = (tabId: TabType) => {
    if (tabId === 'all') {
      setActiveSearchFilters(['all']);
      return;
    }
    
    let newFilters: TabType[] = activeSearchFilters.filter(f => f !== 'all');
    if (newFilters.includes(tabId)) {
      newFilters = newFilters.filter(f => f !== tabId);
      if (newFilters.length === 0) newFilters = (['all'] as TabType[]);
    } else {
      newFilters.push(tabId);
    }
    setActiveSearchFilters(newFilters);
  };

  const displayedDocuments = useMemo(() => {
    let tabDocs = documentsByType[activeTab] || documents;
    
    // Apply search filters if in search mode
    if (isSearchOpen) {
      if (!activeSearchFilters.includes('all')) {
        tabDocs = documents.filter(doc => activeSearchFilters.includes(doc.type as TabType));
      } else {
        tabDocs = documents;
      }
    }
    
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Filter by selected month/year from the calendar navigation
    return tabDocs.filter(doc => {
      const docDate = parseISO(doc.createdAt);
      return docDate.getMonth() === currentMonth && 
             docDate.getFullYear() === currentYear;
    });
  }, [documentsByType, activeTab, isSearchOpen, activeSearchFilters, documents, currentDate]);

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
  const handleMonthChange = (date: Date) => {
    setCurrentDate(date);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setIsDatePickerOpen(false);
  };

  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentDate(setMonth(currentDate, monthIndex));
    setIsDatePickerOpen(false);
    setPickerView('days');
  };

  const handleYearSelect = (year: number) => {
    setCurrentDate(setYear(currentDate, year));
    setPickerView('months');
  };

  const handleYearChange = (offset: number) => {
    setCurrentDate(setYear(currentDate, getYear(currentDate) + offset));
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

    if (isSameDay(docDate, currentDate)) {
      // If already on this date, open the day timeline view
      handleViewTypeChange('day');
    } else {
      // If different date, just jump to it first
      setCurrentDate(docDate);
    }
  };

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-900 overflow-hidden flex flex-col relative">
      {viewType === 'day' ? (
        <DayTimelineView
          currentDate={currentDate}
          documents={documents}
          onBack={() => setViewType('calendar')}
          onDocumentClick={onDocumentClick}
          onCreateClick={onCreateClick}
          onDateChange={setCurrentDate}
        />
      ) : (
        <>
          {/* Header - iOS Calendar Style */}
      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md px-4 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] pb-2 sticky top-0 z-[60] border-b border-slate-100/50 dark:border-slate-700/50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setIsDatePickerOpen(!isDatePickerOpen);
                if (!isDatePickerOpen) setPickerView('months');
              }}
              className={cn(
                "flex items-center gap-0.5 px-3 py-1.5 rounded-full font-bold text-sm transition-all shadow-sm active:scale-95",
                isDatePickerOpen 
                  ? "bg-blue-600 text-white" 
                  : "bg-slate-100 dark:bg-slate-700 text-blue-600 dark:text-blue-400 hover:bg-slate-200"
              )}
            >
              <ChevronLeft className={cn("w-4 h-4 stroke-[3] transition-transform", isDatePickerOpen && "-rotate-90")} />
              {format(currentDate, 'yyyy', { locale: ru })}
            </button>

            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 capitalize tracking-tight">
              {format(currentDate, 'LLLL', { locale: ru })}
            </h1>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button 
              onClick={() => handleViewTypeChange(viewType === 'calendar' ? 'list' : 'calendar')}
              className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-blue-600 dark:text-blue-400"
              title="Список/Календарь"
            >
              {viewType === 'calendar' ? <List className="w-6 h-6 stroke-[2.5]" /> : <CalendarIcon className="w-6 h-6 stroke-[2.5]" />}
            </button>

            <button 
              onClick={toggleSearch}
              className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-blue-600 dark:text-blue-400"
              title="Поиск"
            >
              <Search className="w-6 h-6 stroke-[2.5]" />
            </button>

            <button 
              onClick={onCreateClick}
              className="p-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md active:scale-95"
              title="Добавить"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 12H19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Full-screen Date Picker Overlay */}
      <div className={cn(
        "absolute inset-x-0 top-[calc(4rem+env(safe-area-inset-top,0px))] bottom-0 bg-white/95 dark:bg-slate-900/95 z-50 flex flex-col transition-[transform,opacity] duration-200 ease-out will-change-[transform,opacity]",
        isDatePickerOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2 pointer-events-none"
      )}>
        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          <div className="max-w-2xl mx-auto w-full space-y-8 py-4">
            {/* Controls - Compact and Centralized */}
            <div className="flex items-center justify-center gap-6 md:gap-12">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all active:scale-90 relative z-10" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (pickerView === 'days') prevMonth();
                  else if (pickerView === 'months') handleYearChange(-1);
                  else handleYearChange(-12);
                }}
              >
                <ChevronLeft className="h-6 w-6 text-blue-600" />
              </Button>
              
              <button 
                className="text-4xl md:text-6xl font-black text-slate-900 dark:text-slate-100 capitalize hover:text-blue-600 transition-colors tracking-tighter relative z-10 touch-manipulation"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handlePickerHeaderClick();
                }}
              >
                {pickerView === 'days' && format(currentDate, 'LLLL yyyy', { locale: ru })}
                {pickerView === 'months' && format(currentDate, 'yyyy', { locale: ru })}
                {pickerView === 'years' && `${years[0]} - ${years[years.length - 1]}`}
              </button>

              <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all active:scale-90 relative z-10" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (pickerView === 'days') nextMonth();
                  else if (pickerView === 'months') handleYearChange(1);
                  else handleYearChange(12);
                }}
              >
                <ChevronRight className="h-6 w-6 text-blue-600" />
              </Button>
            </div>

            {/* Selection Grid - Optimized rendering with transitions */}
            <div className="grid gap-4 relative min-h-[400px]">
              {pickerView === 'months' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 animate-in fade-in zoom-in-95 duration-200">
                  {months.map((month, index) => (
                    <button
                      key={month}
                      className={cn(
                        "h-20 md:h-28 rounded-3xl text-lg md:text-xl font-black transition-all border-4 relative z-10 active:scale-95 touch-manipulation",
                        currentDate.getMonth() === index 
                          ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30 scale-[1.03]" 
                          : "bg-slate-100/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleMonthSelect(index);
                      }}
                    >
                      {month}
                    </button>
                  ))}
                </div>
              )}

              {pickerView === 'years' && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 animate-in fade-in zoom-in-95 duration-200">
                  {years.map((year) => (
                    <button
                      key={year}
                      className={cn(
                        "h-20 md:h-28 rounded-3xl text-lg md:text-xl font-black transition-all border-4 relative z-10 active:scale-95 touch-manipulation",
                        getYear(currentDate) === year 
                          ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30 scale-[1.03]" 
                          : "bg-slate-100/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleYearSelect(year);
                      }}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Quick Actions */}
            <div className="pt-4 flex justify-center">
              <Button 
                variant="secondary" 
                className="rounded-2xl px-10 h-12 text-sm font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-0 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
                onClick={goToToday}
              >
                Сегодня
              </Button>
            </div>
          </div>
        </div>
      </div>



      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-white dark:bg-slate-900 z-[100] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-4 p-4 border-b border-slate-100 dark:border-slate-800">
            <button onClick={toggleSearch} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
              <ChevronLeft className="w-6 h-6 text-slate-600 dark:text-slate-300" />
            </button>
            <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              autoFocus
              type="text"
              placeholder="Поиск по номеру или названию..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-11 pr-11 h-12 bg-slate-100 dark:bg-slate-800 border-0 focus-visible:ring-blue-500 text-base rounded-2xl"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search Filters */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide p-4 pt-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeSearchFilters.includes(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => toggleSearchFilter(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border',
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                )}
              >
                <Icon className={cn("w-4 h-4", isSelected ? "text-white" : "text-slate-400")} />
                {tab.label}
              </button>
            );
          })}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
            {searchQuery ? (
              <div className="space-y-4">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 px-2">
                  Результаты поиска ({displayedDocuments.length})
                </p>
                {displayedDocuments.length > 0 ? (
                  <div className="grid gap-3">
                    {displayedDocuments.map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => {
                          handleSearchResultClick(doc);
                          toggleSearch();
                        }}
                        className="w-full text-left p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:border-blue-200 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{doc.number}</span>
                          <span className="text-xs text-slate-400">{formatDate(doc.createdAt)}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100">{doc.title}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{doc.description}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Search className="w-12 h-12 mb-4 opacity-20" />
                    <p>Ничего не найдено</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Search className="w-12 h-12 mb-4 opacity-20" />
                <p>Введите текст для поиска</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className={cn(
        "w-full flex-1 overflow-hidden",
        "p-0"
      )}>
        <div className={cn(
          "flex flex-col h-full relative",
          viewType === 'calendar' && searchQuery && "lg:flex-row"
        )}>
          {/* Main Content Area */}
          <div className={cn(
            "flex-1 min-w-0 h-full flex flex-col relative",
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
                <div className="p-4 space-y-3 overflow-y-auto h-full pb-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 hover:scrollbar-thumb-slate-300 dark:hover:scrollbar-thumb-slate-600">
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
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-y-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 hover:scrollbar-thumb-slate-300 dark:hover:scrollbar-thumb-slate-600">
                  {displayedDocuments.map((doc) => {
                    const TypeIcon = typeIcons[doc.type];
                    return (
                      <div
                        key={doc.id}
                        onClick={() => onDocumentClick(doc)}
                        className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-[0.98] transition-transform duration-150 cursor-pointer flex flex-col h-full"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", typeColors[doc.type])}>
                            <TypeIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 truncate">
                                {doc.number}
                              </span>
                              <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full border font-medium whitespace-nowrap",
                                doc.status === 'active' ? "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:border-green-800" :
                                doc.status === 'draft' ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800" :
                                "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                              )}>
                                {documentStatusLabels[doc.status]}
                              </span>
                            </div>
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1 line-clamp-2 leading-tight">
                              {doc.title}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                              {doc.description}
                            </p>
                          </div>
                        </div>
                        
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[10px] text-slate-400">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            {formatDate(doc.createdAt)}
                          </div>
                          {doc.equipmentLocation && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate max-w-[80px]">{doc.equipmentLocation}</span>
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
               documents={documents}
               currentDate={currentDate}
               selectedDocId={selectedDocId}
               onMonthChange={handleMonthChange}
               onDateChange={(date) => {
                 setCurrentDate(date);
                 handleViewTypeChange('day');
               }}
             />
            )}

            {/* Floating "Today" Button (iOS Style) - Positioned relative to main content */}
            <div className="fixed md:absolute bottom-24 md:bottom-6 left-6 z-[60]">
              <button
                onClick={goToToday}
                className="bg-transparent backdrop-blur-[3px] px-6 py-2.5 rounded-full border border-slate-400 dark:border-slate-500 text-blue-600 dark:text-blue-400 font-bold text-sm active:scale-95 transition-all hover:bg-white/10 shadow-none"
              >
                Сегодня
              </button>
            </div>
          </div>

          {/* Search Results Sidebar (only for Calendar view with search) */}
          {viewType === 'calendar' && searchQuery && (
            <div className="lg:w-1/3 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-blue-50/50 dark:bg-blue-900/10">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Результаты поиска</h3>
                </div>
                <span className="text-[10px] font-bold text-blue-600/50 dark:text-blue-400/50 bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                  {displayedDocuments.length}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {displayedDocuments.length > 0 ? (
                  displayedDocuments.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => handleSearchResultClick(doc)}
                      className={cn(
                        "w-full text-left p-4 rounded-2xl border transition-all active:scale-[0.98]",
                        selectedDocId === doc.id
                          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm"
                          : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-blue-100 shadow-sm"
                      )}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{doc.number}</span>
                        <span className="text-[10px] text-slate-400">{formatDate(doc.createdAt)}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">{doc.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{doc.description}</p>
                    </button>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                      <Search className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-500">Ничего не найдено</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )}
</div>
);
}
