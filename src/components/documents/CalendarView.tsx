import { useMemo, useRef, useEffect, memo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  parseISO,
  addMonths,
  getYear
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Document } from '@/types';

interface CalendarViewProps {
  documents: Document[];
  currentDate: Date;
  selectedDocId?: string | null;
  onMonthChange?: (date: Date) => void;
  onDateChange?: (date: Date) => void;
}

export const CalendarView = memo(function CalendarView({ 
  documents, 
  currentDate,
  selectedDocId,
  onMonthChange,
  onDateChange
}: CalendarViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const monthRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const initialScrolled = useRef(false);
  const lastReportedMonthId = useRef<string | null>(null);

  // Generate calendar grid centered around currentDate
  const calendarMonths = useMemo(() => {
    const months = [];
    // Use the year from currentDate as base to ensure the selected date is always available
    const baseDate = startOfMonth(currentDate);
    
    // Range of 2 years back and 2 years forward from the current viewed date
    // Total 49 months (4 years + current month)
    for (let i = -24; i <= 24; i++) {
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
  }, [getYear(currentDate)]); // Re-generate only when year changes to avoid too frequent updates

  // Intersection Observer for performance
  useEffect(() => {
    if (!scrollContainerRef.current || !onMonthChange) return;

    const options = {
      root: scrollContainerRef.current,
      threshold: [0, 0.1, 0.5, 0.9, 1.0],
      rootMargin: '-80px 0px -20% 0px' 
    };

    const observer = new IntersectionObserver((entries) => {
      const intersecting = entries.filter(e => e.isIntersecting);
      if (intersecting.length === 0) return;

      // Find the month that is most prominent in the viewport
      const topEntry = intersecting.reduce((prev, curr) => 
        (curr.intersectionRatio > prev.intersectionRatio ? curr : prev)
      );
      
      const monthId = topEntry.target.getAttribute('data-month-id');
      if (monthId && monthId !== lastReportedMonthId.current) {
        const [year, month] = monthId.split('-').map(Number);
        lastReportedMonthId.current = monthId;
        // Batch updates or delay to prevent UI lag
        requestAnimationFrame(() => {
          onMonthChange(new Date(year, month - 1, 1));
        });
      }
    }, options);

    Object.values(monthRefs.current).forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, [calendarMonths, onMonthChange]);

  // Use layoutEffect for instant positioning before paint
  useEffect(() => {
    if (!initialScrolled.current) {
      const monthId = format(currentDate, 'yyyy-MM');
      lastReportedMonthId.current = monthId;
      const element = monthRefs.current[monthId];
      if (element && scrollContainerRef.current) {
        // Same offset here to avoid cutting off the first month's header
        const stickyHeaderHeight = 44;
        scrollContainerRef.current.scrollTop = element.offsetTop - stickyHeaderHeight;
        initialScrolled.current = true;
      }
    }
  }, [calendarMonths, currentDate]);

  // Handle month changes from header
  useEffect(() => {
    if (initialScrolled.current) {
      const monthId = format(currentDate, 'yyyy-MM');
      
      // We need to wait for the DOM to update if calendarMonths changed
      const scrollToMonth = () => {
        const element = monthRefs.current[monthId];
        if (element && scrollContainerRef.current) {
          // The weekday header (п, в, с...) is sticky and covers the top part.
          // Subtract its height (approx 44px) so the month header is visible.
          const stickyHeaderHeight = 44;
          scrollContainerRef.current.scrollTop = element.offsetTop - stickyHeaderHeight;
          lastReportedMonthId.current = monthId;
        }
      };

      if (monthId !== lastReportedMonthId.current) {
        // Try immediately
        scrollToMonth();
        // Also try after a frame to be sure
        requestAnimationFrame(scrollToMonth);
      }
    }
  }, [currentDate, calendarMonths]);

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
    onDateChange?.(day);
    onMonthChange?.(day);
  };

  const getDayDocuments = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return documentsByDate[dateKey] || [];
  };

    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
    // Row height logic: 
    // Total calendar height = (Viewport height - main header - week header).
    // Main header is approx 80px, Week header is approx 44px. Total offset 124px.
    // If we want 6 weeks to fit perfectly, we divide by 6.
    const rowHeight = isDesktop ? 'min-h-[calc((100vh-124px)/6)]' : 'min-h-[calc((100vh-220px)/6)]';

    // Group days into weeks for each month
  const calendarMonthsWithWeeks = useMemo(() => {
    return calendarMonths.map(month => {
      const weeks = [];
      for (let i = 0; i < month.days.length; i += 7) {
        weeks.push(month.days.slice(i, i + 7));
      }
      return { ...month, weeks };
    });
  }, [calendarMonths]);

  const getMonthName = (date: Date, index: number) => {
    const fullMonth = format(date, 'LLLL', { locale: ru });
    // If month starts on Monday (0) or Sunday (6), it's close to edges
    // We should shorten names for better fit
    if (index === 0 || index === 6 || index === 1 || index === 5) {
      const shortNames: Record<string, string> = {
        'январь': 'Янв.',
        'февраль': 'Февр.',
        'март': 'Март',
        'апрель': 'Апр.',
        'май': 'Май',
        'июнь': 'Июнь',
        'июль': 'Июль',
        'август': 'Авг.',
        'сентябрь': 'Сент.',
        'октябрь': 'Окт.',
        'ноябрь': 'Нояб.',
        'декабрь': 'Дек.'
      };
      return shortNames[fullMonth.toLowerCase()] || fullMonth;
    }
    return fullMonth;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      {/* Week days */}
      <div className="grid grid-cols-7 border-b border-slate-100/50 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-30">
        {['п', 'в', 'с', 'ч', 'п', 'с', 'в'].map((day, index) => (
          <div key={index} className="py-2.5 text-center text-[10px] md:text-sm uppercase font-black text-slate-400 dark:text-slate-500 tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Content - Scrollable Months */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 hover:scrollbar-thumb-slate-300 dark:hover:scrollbar-thumb-slate-600 transition-colors"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {calendarMonthsWithWeeks.map((month) => (
          <div 
            key={month.id} 
            data-month-id={month.id}
            ref={(el) => {
              monthRefs.current[month.id] = el;
            }}
            className="mb-8"
          >
            {month.weeks.map((week, weekIdx) => {
              // Check if this week contains the 1st day of the current month
              const firstDayIndex = week.findIndex(day => 
                isSameMonth(day, month.date) && format(day, 'd') === '1'
              );

              return (
                <div key={weekIdx}>
                  {/* Month name row (iOS Style) - shown if this week has the 1st day */}
                  {firstDayIndex !== -1 && (
                    <div className="grid grid-cols-7 mb-1">
                      {week.map((_, i) => (
                        <div key={i} className="px-1 flex justify-center">
                          {i === firstDayIndex && (
                            <div className="flex flex-col items-center w-full">
                              <div className={cn(
                                "text-xl font-bold capitalize tracking-tight py-2 text-center border-b border-slate-200 dark:border-slate-700 px-2 whitespace-nowrap",
                                isSameMonth(week[i], new Date()) ? "text-[#ff3b30] border-[#ff3b30]/30" : "text-slate-900 dark:text-slate-100"
                              )}>
                                {getMonthName(week[i], i)}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Week days row */}
                  <div className="grid grid-cols-7 auto-rows-fr">
                    {week.map((day) => {
                      const dayDocs = getDayDocuments(day);
                      const isCurrentMonth = isSameMonth(day, month.date);
                      const isTodayDate = isSameDay(day, new Date());
                      const isSelectedDay = selectedDocId && dayDocs.some(doc => doc.id === selectedDocId);
                      
                      return (
                        <div
                          key={day.toString()}
                          onClick={() => handleDayClick(day)}
                          className={cn(
                            rowHeight,
                            "border-b border-slate-100/50 dark:border-slate-800/50 p-1 transition-all relative group cursor-pointer flex flex-col items-center",
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
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});
