import type { Ticket } from '@/types';
import { StatusBadge } from './StatusBadge';
import { PriorityIndicator } from './PriorityIndicator';
import { categoryLabels } from '@/types';
import { Calendar, User, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TicketCardProps {
  ticket: Ticket;
  onClick?: () => void;
  className?: string;
}

export function TicketCard({ ticket, onClick, className }: TicketCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays === 1) return 'Вчера';
    if (diffDays < 7) return `${diffDays} дн назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700',
        'active:scale-[0.98] transition-transform duration-150',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400">{ticket.number}</span>
          <PriorityIndicator priority={ticket.priority} />
        </div>
        <StatusBadge status={ticket.status} />
      </div>

      <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1 line-clamp-2">{ticket.title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{ticket.description}</p>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(ticket.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            <span>{ticket.author.name}</span>
          </div>
        </div>
        
        {ticket.comments.length > 0 && (
          <div className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{ticket.comments.length}</span>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
          {categoryLabels[ticket.category]}
        </span>
        {ticket.assignee && (
          <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
            {ticket.assignee.name}
          </span>
        )}
      </div>
    </div>
  );
}
