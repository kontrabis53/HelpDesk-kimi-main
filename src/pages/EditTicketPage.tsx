import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { EditTicketScreen } from '@/screens/EditTicketScreen';
import { useTicketStore } from '@/stores/ticketStore';
import { useRoleStore } from '@/stores/roleStore';
import { toast } from 'sonner';
import type { TicketCategory, TicketPriority } from '@/types';

export function EditTicketPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const selectedTicket = useTicketStore((state) => state.selectedTicket);
  const getTicketById = useTicketStore((state) => state.getTicketById);
  const setSelectedTicket = useTicketStore((state) => state.setSelectedTicket);
  const updateTicket = useTicketStore((state) => state.updateTicket);
  const deleteTicket = useTicketStore((state) => state.deleteTicket);
  
  const addLog = useRoleStore((state) => state.addLog);
  
  useEffect(() => {
    const fetchTicket = async () => {
      if (id) {
        const ticket = await getTicketById(id);
        if (ticket) {
          setSelectedTicket(ticket);
        } else {
          toast.error('Заявка не найдена');
          navigate('/tickets');
        }
      }
    };
    fetchTicket();
  }, [id, getTicketById, setSelectedTicket, navigate]);
  
  if (!selectedTicket) {
    return null;
  }
  
  const handleBack = () => {
    navigate(`/tickets/${id}`);
  };
  
  const handleUpdate = async (ticketId: string, data: {
    title: string;
    description: string;
    category: TicketCategory;
    priority: TicketPriority;
  }) => {
    await updateTicket(ticketId, data);
    addLog('ticket.updated', 'ticket', ticketId, undefined, `Заявка обновлена: ${data.title}`);
    toast.success('Заявка обновлена', {
      description: 'Изменения успешно сохранены',
    });
    navigate(`/tickets/${ticketId}`);
  };
  
  const handleDelete = async (ticketId: string) => {
    const ticket = await getTicketById(ticketId);
    await deleteTicket(ticketId);
    addLog('ticket.deleted', 'ticket', ticketId, ticket?.number, `Удалена заявка: ${ticket?.title}`);
    toast.success('Заявка удалена');
    navigate('/tickets');
  };
  
  return (
    <EditTicketScreen
      ticket={selectedTicket}
      onBack={handleBack}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}
