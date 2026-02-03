import { TicketListScreen } from '@/screens/TicketListScreen';
import { useTicketStore } from '@/stores/ticketStore';
import { useNavigate } from 'react-router-dom';

export function TicketsPage() {
  const navigate = useNavigate();
  const tickets = useTicketStore((state) => state.filteredTickets());
  const ticketsByStatus = useTicketStore((state) => state.ticketsByStatus());
  const setFilter = useTicketStore((state) => state.setFilter);
  const setSelectedTicket = useTicketStore((state) => state.setSelectedTicket);
  
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
