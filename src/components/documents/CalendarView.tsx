import { useState, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  addMonths, 
  subMonths,
  isToday,
  parseISO,
  setMonth,
  setYear,
  getYear
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { Document } from '@/types';
import { documentStatusLabels } from '@/types';

interface CalendarViewProps {
  documents: Document[];
  onDocumentClick: (doc: Document) => void;
}

export function CalendarView({ documents, onDocumentClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerView, setPickerView] = useState<'days' | 'months' | 'years'>('days');

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

  // Generate years for years view (12 years)
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

  const typeColors: Record<string, string> = {
    act: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    repair: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    maintenance: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    inventory: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
    other: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Popover open={isDatePickerOpen} onOpenChange={(open) => {
              setIsDatePickerOpen(open);
              if (open) setPickerView('days');
            }}>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="text-lg font-semibold text-slate-800 dark:text-slate-100 capitalize px-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1"
                >
                  {format(currentDate, 'LLLL yyyy', { locale: ru })}
                  <ChevronDown className={cn("h-4 w-4 transition-transform", isDatePickerOpen && "rotate-180")} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                {/* Custom Hierarchical Picker inside Popover */}
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
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5 ml-4">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={goToToday}>
              Сегодня
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
          <div key={day} className="py-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {calendarDays.map((day) => {
              const dayDocs = getDayDocuments(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);
              
              return (
                <div
                  key={day.toString()}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "min-h-[80px] md:min-h-[100px] border-b border-r border-slate-100 dark:border-slate-700/50 p-1 md:p-2 transition-colors relative group cursor-pointer",
                    !isCurrentMonth && "bg-slate-50/50 dark:bg-slate-900/20 text-slate-400 dark:text-slate-600",
                    isCurrentMonth && "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/30",
                    dayDocs.length > 0 && "cursor-pointer"
                  )}
                >
                  {/* Day Number */}
                  <div className="flex justify-center md:justify-start">
                    <span
                      className={cn(
                        "text-xs md:text-sm font-medium w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full",
                        isTodayDate
                          ? "bg-blue-600 text-white"
                          : "text-slate-700 dark:text-slate-300"
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>

                  {/* Documents Indicators */}
                  <div className="mt-1 space-y-1">
                    {/* Mobile: Dots */}
                    <div className="md:hidden flex flex-wrap justify-center gap-1 mt-1">
                      {dayDocs.slice(0, 3).map((doc) => (
                        <div 
                          key={doc.id} 
                          className={cn("w-1.5 h-1.5 rounded-full", typeColors[doc.type]?.split(' ')[0] || 'bg-slate-400')}
                        />
                      ))}
                      {dayDocs.length > 3 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      )}
                    </div>

                    {/* Desktop: Bars */}
                    <div className="hidden md:block space-y-1 mt-1">
                      {dayDocs.slice(0, 3).map((doc) => (
                        <div
                          key={doc.id}
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded truncate font-medium",
                            typeColors[doc.type]
                          )}
                        >
                          {doc.title}
                        </div>
                      ))}
                      {dayDocs.length > 3 && (
                        <div className="text-[10px] text-slate-400 pl-1">
                          Еще {dayDocs.length - 3}...
                        </div>
                      )}
                    </div>
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
