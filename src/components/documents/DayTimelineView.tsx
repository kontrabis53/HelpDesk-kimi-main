import { useMemo, useRef, useEffect, useState } from 'react';
import { 
  format, 
  startOfWeek, 
  addDays, 
  isSameDay, 
  parseISO,
  setHours,
  setMinutes
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Document } from '@/types';
import { Button } from '@/components/ui/button';

interface DayTimelineViewProps {
  currentDate: Date;
  documents: Document[];
  onBack: () => void;
  onDocumentClick: (doc: Document) => void;
  onCreateClick: () => void;
  onDateChange: (date: Date) => void;
}

export function DayTimelineView({ 
  currentDate, 
  documents, 
  onBack, 
  onDocumentClick, 
  onCreateClick,
  onDateChange
}: DayTimelineViewProps) {
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Hours for the vertical scale (00:00 to 23:00)
  const hours = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => i);
  }, []);

  // Calculate week days for the top horizontal picker
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  // Documents for the current viewed range
  const getDayDocuments = (date: Date) => {
    return documents.filter(doc => isSameDay(parseISO(doc.createdAt), date));
  };

  // Logic for iOS-style two-day view on mobile
  const mobileDays = useMemo(() => {
    return [currentDate, addDays(currentDate, 1)];
  }, [currentDate]);

  // Desktop view shows the whole week
  const displayedDays = useMemo(() => {
    return isDesktop ? weekDays : mobileDays;
  }, [isDesktop, weekDays, mobileDays]);

  // Sync horizontal scroll for time scale and grid if needed
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      // Set initial scroll to 07:00 as requested
      const hourHeight = 64; // h-16
      requestAnimationFrame(() => {
        container.scrollTop = 7 * hourHeight;
      });
    }
  }, []);

  // Calculate current time line position
  const currentTimePosition = useMemo(() => {
    const hour = now.getHours();
    const minutes = now.getMinutes();
    return hour * 64 + (minutes / 60) * 64;
  }, [now]);

  // Touch swiping logic for mobile (2 days view)
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      onDateChange(addDays(currentDate, 1));
    } else if (isRightSwipe) {
      onDateChange(addDays(currentDate, -1));
    }
  };

  return (
    <div 
      className="flex flex-col h-full bg-white dark:bg-slate-950 animate-in fade-in slide-in-from-right-4 duration-300"
      onTouchStart={!isDesktop ? handleTouchStart : undefined}
      onTouchMove={!isDesktop ? handleTouchMove : undefined}
      onTouchEnd={!isDesktop ? handleTouchEnd : undefined}
    >
      {/* Top Navigation - iOS Style */}
      <div className="flex-shrink-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 z-30">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center text-blue-600 dark:text-blue-400 font-medium active:opacity-50 transition-opacity"
          >
            <ChevronLeft className="w-6 h-6 mr-1" />
            <span className="text-lg capitalize">{format(currentDate, 'LLLL', { locale: ru })}</span>
          </button>
          
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" className="rounded-full">
               <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" onClick={onCreateClick} />
             </Button>
          </div>
        </div>

        {/* Day Picker (Horizontal) */}
        <div className={cn(
          "grid select-none touch-pan-x pb-3",
          isDesktop ? "grid-cols-[60px_1fr]" : "grid-cols-[50px_1fr]"
        )}>
          {/* Empty space to align with time scale */}
          <div />
          
          <div className="grid grid-cols-7">
            {weekDays.map((day) => {
              const isActive = isSameDay(day, currentDate);
              const isToday = isSameDay(day, new Date());
              
              return (
                <button 
                  key={day.toString()}
                  onClick={() => onDateChange(day)}
                  className="flex flex-col items-center gap-1 py-1 relative"
                >
                  {/* Background pill for iOS style selection/today area */}
                  {(isActive || isToday) && (
                    <div className={cn(
                      "absolute inset-x-0.5 top-0 bottom-0 bg-slate-100/80 dark:bg-slate-800/50 rounded-lg -z-10",
                      isActive && isToday ? "bg-red-50 dark:bg-red-900/10" : ""
                    )} />
                  )}
                  
                  <span className={cn(
                    "text-[10px] font-bold tracking-tight capitalize",
                    isToday ? "text-[#ff3b30]" : "text-slate-400 dark:text-slate-500"
                  )}>
                    {format(day, 'eeeeee', { locale: ru })}
                  </span>
                  <span className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-full text-lg font-bold transition-all",
                    isActive 
                      ? (isToday ? "bg-[#ff3b30] text-white shadow-lg shadow-red-500/30" : "bg-black dark:bg-white text-white dark:text-black") 
                      : (isToday ? "text-[#ff3b30]" : "text-slate-900 dark:text-slate-100")
                  )}>
                    {format(day, 'd')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        {/* Column Headers for Timeline (Desktop: Week, Mobile: 2 Days) */}
        <div className={cn(
          "grid border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white/95 dark:bg-slate-900/95 z-20",
          isDesktop ? "grid-cols-[60px_1fr]" : "grid-cols-[50px_1fr]"
        )}>
          <div className="border-r border-slate-100 dark:border-slate-800" />
          <div className={cn("grid", isDesktop ? "grid-cols-7" : "grid-cols-2")}>
            {displayedDays.map((day, idx) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div key={idx} className="py-2 text-center border-r border-slate-100 dark:border-slate-800 last:border-r-0">
                  <span className={cn(
                    "text-[11px] font-bold",
                    isToday ? "text-[#ff3b30]" : "text-slate-500 dark:text-slate-400"
                  )}>
                    <span className="capitalize">{format(day, 'eeeeee', { locale: ru })}</span>
                    <span>{format(day, ' — d MMM', { locale: ru })}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scrollable Area */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto scrollbar-hide relative overscroll-contain touch-pan-y"
        >
          <div className={cn(
            "grid min-h-full",
            isDesktop ? "grid-cols-[60px_1fr]" : "grid-cols-[50px_1fr]"
          )}>
            {/* Time Scale */}
            <div className="border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 relative">
              {hours.map(hour => (
                <div key={hour} className="h-16 flex justify-center pt-1 pr-2">
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    {format(setMinutes(setHours(new Date(), hour), 0), 'HH:mm')}
                  </span>
                </div>
              ))}
              
              {/* Current Time Label (Fixed at left) */}
              <div 
                className="absolute left-0 right-0 z-30 pointer-events-none flex items-center justify-center will-change-transform"
                style={{ top: `${currentTimePosition}px` }}
              >
                <span className="bg-[#ff3b30] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm -translate-y-1/2">
                  {format(now, 'HH:mm')}
                </span>
              </div>
            </div>

            {/* Content Grid */}
            <div className={cn("grid relative", isDesktop ? "grid-cols-7" : "grid-cols-2")}>
              {/* Horizontal Lines */}
              <div className="absolute inset-0 pointer-events-none">
                {hours.map(hour => (
                  <div key={hour} className="h-16 border-b border-slate-100 dark:border-slate-800/50 w-full" />
                ))}
              </div>

              {/* Day Columns */}
              {displayedDays.map((day, dayIdx) => {
                const dayDocs = getDayDocuments(day);
                const isToday = isSameDay(day, now);
                
                return (
                  <div key={dayIdx} className="relative border-r border-slate-100 dark:border-slate-800 last:border-r-0 min-h-full group">
                    {/* Current Time Line (Only for today's column) */}
                    {isToday && (
                      <div 
                        className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                        style={{ top: `${currentTimePosition}px` }}
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ff3b30] -ml-1.25 shadow-sm border-2 border-white dark:border-slate-950 z-30" />
                        <div className="flex-1 h-[2px] bg-[#ff3b30]" />
                      </div>
                    )}
                    
                    {/* Events for this day */}
                    {dayDocs.map((doc) => {
                      // Mock positioning logic - in real app we'd use doc.createdAt time
                      const docDate = parseISO(doc.createdAt);
                      const hour = docDate.getHours();
                      const minutes = docDate.getMinutes();
                      
                      const top = hour * 64 + (minutes / 60) * 64;
                      
                      return (
                        <div 
                          key={doc.id}
                          onClick={() => onDocumentClick(doc)}
                          className={cn(
                            "absolute left-1 right-1 p-1.5 rounded-lg border-l-4 shadow-sm cursor-pointer transition-all hover:scale-[1.02] active:scale-95 z-10",
                            doc.type === 'act' ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300" :
                            doc.type === 'repair' ? "bg-amber-50 dark:bg-amber-900/20 border-amber-500 text-amber-700 dark:text-amber-300" :
                            "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-300"
                          )}
                          style={{ 
                            top: `${top}px`,
                            minHeight: '40px'
                          }}
                        >
                          <div className="text-[10px] font-black leading-none mb-1 uppercase tracking-tighter opacity-70">
                            {format(docDate, 'HH:mm')}
                          </div>
                          <div className="text-[11px] font-bold leading-tight line-clamp-2">
                            {doc.title}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Empty cell clicks for creation */}
                    <div className="absolute inset-0 z-0">
                      {hours.map(hour => (
                        <div 
                          key={hour} 
                          className="h-16 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer" 
                          onClick={() => onCreateClick()}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Floating "Today" - iOS Style */}
      <div className="absolute bottom-8 left-6 z-40">
        <button
          onClick={() => onDateChange(new Date())}
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md px-6 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 font-bold text-sm active:scale-95 transition-all shadow-xl"
        >
          Сегодня
        </button>
      </div>
    </div>
  );
}
