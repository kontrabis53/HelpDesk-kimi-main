import { useState, useMemo, useRef, useEffect } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday,
  parseISO,
  addMonths
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Document } from '@/types';
import { documentStatusLabels } from '@/types';

interface CalendarViewProps {
  documents: Document[];
  onDocumentClick: (doc: Document) => void;
  currentDate: Date;
  selectedDocId?: string | null;
}

export function CalendarView({ 
  documents, 
  onDocumentClick, 
  currentDate,
  selectedDocId 
}: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const monthRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const initialScrolled = useRef(false);

  // Generate calendar grid (Multiple months for scrolling)
  const calendarMonths = useMemo(() => {
    const months = [];
    const baseDate = startOfMonth(new Date());
    // Reduced range for better performance on older devices
    for (let i = -6; i <= 12; i++) {
      const monthDate = addMonths(baseDate, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthStart);
      const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
      const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
      
      months.push({
        id: format(monthDate, 'yyyy-MM'),
        date: monthDate,
        days: eachDayOfInterval({ start: startDate, end: endDate })
      });
    }
    return months;
  }, []);

  // Initial scroll to current month without animation
  useEffect(() => {
    if (!initialScrolled.current) {
      const monthId = format(currentDate, 'yyyy-MM');
      const element = monthRefs.current[monthId];
      if (element) {
        element.scrollIntoView({ behavior: 'auto', block: 'start' });
        initialScrolled.current = true;
      }
    }
  }, [calendarMonths, currentDate]);

  // Export scroll function if needed or handle via prop change
  useEffect(() => {
    if (initialScrolled.current) {
      const monthId = format(currentDate, 'yyyy-MM');
      const element = monthRefs.current[monthId];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
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
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      {/* Week days */}
      <div className="grid grid-cols-7 border-b border-slate-100/50 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-30">
        {['п', 'в', 'с', 'ч', 'п', 'с', 'в'].map((day, index) => (
          <div key={index} className="py-2.5 text-center text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Content - Scrollable Months */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto scrollbar-hide scroll-smooth"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {calendarMonths.map((month) => (
          <div 
            key={month.id} 
            ref={(el) => {
              monthRefs.current[month.id] = el;
            }}
            className="mb-2"
          >
            {/* Month Label (iOS Style) */}
            <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 border-y border-slate-100/50 dark:border-slate-700/30">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 capitalize">
                {format(month.date, 'LLLL yyyy', { locale: ru })}
              </h3>
            </div>

            <div className="grid grid-cols-7 auto-rows-fr">
              {month.days.map((day) => {
                const dayDocs = getDayDocuments(day);
                const isCurrentMonth = isSameMonth(day, month.date);
                const isTodayDate = isToday(day);
                const isSelectedDay = selectedDocId && dayDocs.some(doc => doc.id === selectedDocId);
                
                return (
                  <div
                    key={day.toString()}
                    onClick={() => handleDayClick(day)}
                    className={cn(
                      "min-h-[85px] border-b border-r border-slate-100/50 dark:border-slate-800/50 p-1 transition-all relative group cursor-pointer flex flex-col items-center",
                      !isCurrentMonth && "bg-slate-50/30 dark:bg-slate-900/30",
                      isSelectedDay && "ring-2 ring-inset ring-blue-500 z-10"
                    )}
                  >
                    {/* Day Number */}
                    <div className="flex flex-col items-center pt-1">
                      <span
                        className={cn(
                          "text-lg font-semibold w-9 h-9 flex items-center justify-center rounded-full transition-all",
                          isTodayDate
                            ? "bg-[#ff3b30] text-white shadow-lg shadow-red-500/20"
                            : isCurrentMonth 
                              ? "text-slate-900 dark:text-slate-100" 
                              : "text-slate-300 dark:text-slate-700"
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                    </div>

                    {/* Documents Indicators (iOS style) */}
                    <div className="flex flex-wrap gap-0.5 mt-1 px-1 justify-center max-w-full">
                      {dayDocs.length > 0 && (
                        <div className="flex gap-0.5 overflow-hidden">
                          {dayDocs.slice(0, 4).map((doc) => (
                            <div 
                              key={doc.id} 
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                doc.type === 'act' ? "bg-blue-500" :
                                doc.type === 'repair' ? "bg-amber-500" :
                                doc.type === 'maintenance' ? "bg-emerald-500" :
                                doc.type === 'inventory' ? "bg-violet-500" : "bg-slate-400"
                              )}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
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
