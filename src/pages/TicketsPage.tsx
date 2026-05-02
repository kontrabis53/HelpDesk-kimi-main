import { useMemo, useEffect } from 'react';
import { TicketListScreen } from '@/screens/TicketListScreen';
import { useTicketStore } from '@/stores/ticketStore';
import { useNavigate } from 'react-router-dom';
import { useRoleStore } from '@/stores/roleStore';
import { toast } from 'sonner';

export function TicketsPage() {
  const navigate = useNavigate();
  const allTickets = useTicketStore((state) => state.tickets);
  const fetchTickets = useTicketStore((state) => state.fetchTickets);
  const filter = useTicketStore((state) => state.filter);
  const setFilter = useTicketStore((state) => state.setFilter);
  const setSelectedTicket = useTicketStore((state) => state.setSelectedTicket);
  const hasPermission = useRoleStore((state) => state.hasPermission);

  useEffect(() => {
    fetchTickets(false); // Fetch active tickets by default
  }, [fetchTickets]);

  const handleTabChange = (tab: string) => {
    if (tab === 'archived') {
      fetchTickets(true);
    } else {
      fetchTickets(false);
    }
  };

  const tickets = useMemo(() => {
    return allTickets.filter((ticket) => {
      if (filter.status && ticket.status !== filter.status) return false;
      if (filter.priority && ticket.priority !== filter.priority) return false;
      if (filter.category && ticket.category !== filter.category) return false;
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const matchesSearch = 
          (ticket.number || '').toLowerCase().includes(searchLower) ||
          (ticket.title || '').toLowerCase().includes(searchLower) ||
          (ticket.description || '').toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allTickets, filter]);

  const ticketsByStatus = useMemo(() => {
    const active = tickets.filter(t => !t.isArchived);
    const archived = tickets.filter(t => t.isArchived);

    return {
      all: active,
      new: active.filter(t => t.status === 'new'),
      in_progress: active.filter(t => t.status === 'in_progress'),
      waiting: active.filter(t => t.status === 'waiting'),
      resolved: active.filter(t => t.status === 'resolved'),
      archived: archived,
    };
  }, [tickets]);
  
  const handleTicketClick = (ticket: any) => {
    setSelectedTicket(ticket);
    navigate(`/tickets/${ticket.id}`);
  };
  
  const handleSearch = (query: string) => {
    setFilter({ search: query });
  };

  const handleCreateClick = () => {
    if (!hasPermission('tickets', 'create')) {
      toast.error('Нет прав', { description: 'У вас нет прав для создания заявок' });
      return;
    }
    navigate('/tickets/create');
  };
  
  return (
    <TicketListScreen
      tickets={tickets}
      ticketsByStatus={ticketsByStatus}
      onTicketClick={handleTicketClick}
      onSearch={handleSearch}
      onCreateClick={handleCreateClick}
      onTabChange={handleTabChange}
    />
  );
}
