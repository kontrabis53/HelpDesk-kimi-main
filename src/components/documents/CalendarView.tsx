import { useState, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday,
  parseISO
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar as CalendarIcon, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Document } from '@/types';
import { documentStatusLabels } from '@/types';

interface CalendarViewProps {
  documents: Document[];
  onDocumentClick: (doc: Document) => void;
  highlightSearch?: boolean;
  currentDate: Date;
  selectedDocId?: string | null;
}

export function CalendarView({ 
  documents, 
  onDocumentClick, 
  highlightSearch, 
  currentDate,
  selectedDocId 
}: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const typeColors: Record<string, string> = {
    act: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    repair: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    maintenance: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    inventory: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
    other: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({
      start: startDate,
      end: endDate,
    });
  }, [currentDate]);

  // Group documents by date
  const documentsByDate = useMemo(() => {
    return documents.reduce((acc, doc) => {
      const dateKey = format(parseISO(doc.createdAt), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(doc);
      return acc;
    }, {} as Record<string, Document[]>);
  }, [documents]);

  const handleDayClick = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayDocs = documentsByDate[dateKey] || [];
    
    if (dayDocs.length > 0) {
      setSelectedDate(day);
      setIsDialogOpen(true);
    }
  };

  const getDayDocuments = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return documentsByDate[dateKey] || [];
  };

  const selectedDayDocuments = selectedDate ? getDayDocuments(selectedDate) : [];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 border-x border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Week days */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
          <div key={day} className="py-1.5 text-center text-xs font-bold text-slate-500 dark:text-slate-400">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-hidden">
        {calendarDays.map((day) => {
              const dayDocs = getDayDocuments(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);
              const isSelectedDay = selectedDocId && dayDocs.some(doc => doc.id === selectedDocId);
              
              return (
                <div
                  key={day.toString()}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "min-h-0 border-b border-r border-slate-100 dark:border-slate-700/50 p-0.5 md:p-1 transition-all relative group cursor-pointer flex flex-col",
                    !isCurrentMonth && "bg-slate-50/50 dark:bg-slate-900/10 text-slate-300 dark:text-slate-700",
                    isCurrentMonth && "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/30",
                    dayDocs.length > 0 && isCurrentMonth && "bg-blue-50/30 dark:bg-blue-900/5",
                    highlightSearch && dayDocs.length > 0 && "bg-blue-50/60 dark:bg-blue-900/10 ring-1 ring-inset ring-blue-100 dark:ring-blue-900",
                    isSelectedDay && "bg-green-50/60 dark:bg-green-900/20 ring-2 ring-inset ring-green-500/50 z-10"
                  )}
                >
                  {/* Day Number and Events Count */}
                  <div className="flex justify-between items-start mb-1">
                    <span
                      className={cn(
                        "text-xs md:text-base font-bold w-5 h-5 md:w-8 md:h-8 flex items-center justify-center rounded-full transition-transform group-hover:scale-110",
                        isTodayDate
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                          : isCurrentMonth ? "text-slate-800 dark:text-slate-200" : "text-slate-300 dark:text-slate-600"
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    
                    {dayDocs.length > 0 && (
                      <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[9px] md:text-[10px] font-black px-1.5 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
                        {dayDocs.length}
                      </span>
                    )}
                  </div>

                  {/* Selected Indicator Checkmark */}
                  {isSelectedDay && (
                    <div className="absolute right-0.5 bottom-0.5 bg-green-500 text-white rounded-full p-0.5 shadow-sm z-20">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}

                  {/* Documents Indicators (Visual Bars) */}
                  <div className="flex-1 flex flex-col gap-0.5 md:gap-1 mt-auto overflow-hidden">
                    {dayDocs.length > 0 && (
                      <div className="flex flex-col gap-0.5 w-full">
                        {/* Display up to 3 bars per day */}
                        {dayDocs.slice(0, 3).map((doc) => (
                          <div 
                            key={doc.id} 
                            className={cn(
                              "h-1 md:h-1.5 w-full rounded-full shadow-sm border-[0.5px] border-black/5 dark:border-white/5",
                              typeColors[doc.type]?.split(' ')[0] || 'bg-slate-400'
                            )}
                          />
                        ))}
                        {dayDocs.length > 3 && (
                          <div className="h-1 w-full flex justify-center gap-0.5">
                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
      </div>

      {/* Dialog for Day Details */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              <span>{selectedDate ? format(selectedDate, 'd MMMM yyyy', { locale: ru }) : ''}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto pr-2">
            {selectedDayDocuments.length > 0 ? (
              selectedDayDocuments.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    onDocumentClick(doc);
                    setIsDialogOpen(false);
                  }}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {doc.number}
                    </span>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full border",
                      doc.status === 'active' ? "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:border-green-800" :
                      doc.status === 'draft' ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800" :
                      "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                    )}>
                      {documentStatusLabels[doc.status]}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">{doc.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{doc.description}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 py-8">Нет документов на эту дату</p>
            )}
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Закрыть
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
