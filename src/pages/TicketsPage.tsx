import { useMemo } from 'react';
import { TicketListScreen } from '@/screens/TicketListScreen';
import { useTicketStore } from '@/stores/ticketStore';
import { useNavigate } from 'react-router-dom';

export function TicketsPage() {
  const navigate = useNavigate();
  const allTickets = useTicketStore((state) => state.tickets);
  const filter = useTicketStore((state) => state.filter);
  const setFilter = useTicketStore((state) => state.setFilter);
  const setSelectedTicket = useTicketStore((state) => state.setSelectedTicket);

  const tickets = useMemo(() => {
    return allTickets.filter((ticket) => {
      if (filter.status && ticket.status !== filter.status) return false;
      if (filter.priority && ticket.priority !== filter.priority) return false;
      if (filter.category && ticket.category !== filter.category) return false;
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const matchesSearch = 
          ticket.number.toLowerCase().includes(searchLower) ||
          ticket.title.toLowerCase().includes(searchLower) ||
          ticket.description.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allTickets, filter]);

  const ticketsByStatus = useMemo(() => {
    return {
      all: tickets,
      new: tickets.filter(t => t.status === 'new'),
      in_progress: tickets.filter(t => t.status === 'in_progress'),
      waiting: tickets.filter(t => t.status === 'waiting'),
      resolved: tickets.filter(t => t.status === 'resolved'),
    };
  }, [tickets]);
  
  const handleTicketClick = (ticket: any) => {
    setSelectedTicket(ticket);
    navigate(`/tickets/${ticket.id}`);
  };
  
  const handleSearch = (query: string) => {
    setFilter({ search: query });
  };
  
  return (
    <TicketListScreen
      tickets={tickets}
      ticketsByStatus={ticketsByStatus}
      onTicketClick={handleTicketClick}
      onSearch={handleSearch}
    />
  );
}
