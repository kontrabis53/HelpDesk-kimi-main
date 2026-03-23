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

  // Generate calendar grid (Multiple months for scrolling)
  const calendarMonths = useMemo(() => {
    const months = [];
    // Show 3 months before and 6 months after for scrolling
    for (let i = -3; i <= 6; i++) {
      const monthDate = addMonths(currentDate, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthStart);
      const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
      const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
      
      months.push({
        date: monthDate,
        days: eachDayOfInterval({ start: startDate, end: endDate })
      });
    }
    return months;
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
      <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm sticky top-[48px] z-20">
        {['п', 'в', 'с', 'ч', 'п', 'с', 'в'].map((day, index) => (
          <div key={index} className="py-2 text-center text-[10px] uppercase font-medium text-slate-400 dark:text-slate-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Content - Scrollable Months */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {calendarMonths.map((month) => (
          <div key={month.date.toString()} className="mb-8">
            {/* Month Label (Visible when scrolling) */}
            <div className="sticky top-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm z-20 px-4 py-2 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 capitalize">
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
                      "min-h-[80px] md:min-h-[120px] border-b border-r border-slate-100 dark:border-slate-700/50 p-1 md:p-1.5 transition-all relative group cursor-pointer flex flex-col items-center",
                      !isCurrentMonth && "opacity-20",
                      isCurrentMonth && "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/30",
                      isSelectedDay && "ring-2 ring-inset ring-blue-500 z-10"
                    )}
                  >
                    {/* Day Number */}
                      <span
                        className={cn(
                          "text-base md:text-xl font-medium w-8 h-8 md:w-12 md:h-12 flex items-center justify-center rounded-full transition-all",
                          isTodayDate
                            ? "bg-[#ff3b30] text-white"
                            : isCurrentMonth ? "text-slate-900 dark:text-slate-100" : "text-slate-400"
                        )}
                      >
                        {format(day, 'd')}
                      </span>

                    {/* Documents Indicators (iOS style) */}
                    <div className="flex flex-wrap gap-0.5 mt-1 px-0.5 justify-center overflow-hidden">
                      {dayDocs.length > 0 && (
                        <>
                          {dayDocs.slice(0, 3).map((doc) => (
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
                        </>
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
