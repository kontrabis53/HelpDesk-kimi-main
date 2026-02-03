import { useState } from 'react';
import type { Ticket } from '@/types';
import { TicketCard } from '@/components/TicketCard';
import { EmptyState } from '@/components/EmptyState';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TicketListScreenProps {
  tickets: Ticket[];
  ticketsByStatus: {
    all: Ticket[];
    new: Ticket[];
    in_progress: Ticket[];
    waiting: Ticket[];
    resolved: Ticket[];
  };
  onTicketClick: (ticket: Ticket) => void;
  onSearch: (query: string) => void;
  onCreateClick?: () => void;
}

type TabType = 'all' | 'new' | 'in_progress' | 'waiting' | 'resolved';

const tabs: { id: TabType; label: string; count?: number }[] = [
  { id: 'all', label: 'Все' },
  { id: 'new', label: 'Новые' },
  { id: 'in_progress', label: 'В работе' },
  { id: 'waiting', label: 'Ожидание' },
  { id: 'resolved', label: 'Решенные' },
];

export function TicketListScreen({ 
  tickets, 
  ticketsByStatus, 
  onTicketClick,
  onSearch,
  onCreateClick
}: TicketListScreenProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const getTicketsForTab = () => {
    switch (activeTab) {
      case 'all': return ticketsByStatus.all;
      case 'new': return ticketsByStatus.new;
      case 'in_progress': return ticketsByStatus.in_progress;
      case 'waiting': return ticketsByStatus.waiting;
      case 'resolved': return ticketsByStatus.resolved;
      default: return tickets;
    }
  };

  const displayedTickets = getTicketsForTab();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 px-4 pt-4 pb-2 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Заявки</h1>
          {onCreateClick && (
            <Button onClick={onCreateClick} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-1" />
              Новая
            </Button>
          )}
        </div>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Поиск по номеру или теме..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 h-10 bg-slate-100 dark:bg-slate-700 border-0 focus-visible:ring-blue-500 dark:text-slate-100"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {tabs.map((tab) => {
            const count = ticketsByStatus[tab.id]?.length;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                )}
              >
                {tab.label}
                {count !== undefined && count > 0 && (
                  <span className={cn(
                    'ml-1.5 text-xs',
                    isActive ? 'text-blue-100' : 'text-slate-400'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ticket List */}
      <div className="p-4 space-y-3 max-w-4xl mx-auto">
        {displayedTickets.length === 0 ? (
          <EmptyState 
            title="Ничего не найдено"
            description="Попробуйте изменить параметры поиска или фильтры"
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {displayedTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onClick={() => onTicketClick(ticket)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
