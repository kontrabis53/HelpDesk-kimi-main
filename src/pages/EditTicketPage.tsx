import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { EditTicketScreen } from '@/screens/EditTicketScreen';
import { useTicketStore } from '@/stores/ticketStore';
import { useRoleStore } from '@/stores/roleStore';
import { toast } from 'sonner';

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
    if (id) {
      const ticket = getTicketById(id);
      if (ticket) {
        setSelectedTicket(ticket);
      } else {
        toast.error('Заявка не найдена');
        navigate('/tickets');
      }
    }
  }, [id, getTicketById, setSelectedTicket, navigate]);
  
  if (!selectedTicket) {
    return null;
  }
  
  const handleBack = () => {
    navigate(`/tickets/${id}`);
  };
  
  const handleUpdate = (ticketId: string, data: any) => {
    updateTicket(ticketId, data);
    addLog('ticket.updated', 'ticket', ticketId, undefined, `Заявка обновлена: ${data.title}`);
    toast.success('Заявка обновлена', {
      description: 'Изменения успешно сохранены',
    });
    navigate(`/tickets/${ticketId}`);
  };
  
  const handleDelete = (ticketId: string) => {
    const ticket = getTicketById(ticketId);
    deleteTicket(ticketId);
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
