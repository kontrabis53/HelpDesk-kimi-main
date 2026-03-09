import { useNavigate } from 'react-router-dom';
import { CreateTicketScreen } from '@/screens/CreateTicketScreen';
import { useTicketStore } from '@/stores/ticketStore';
import { useRoleStore } from '@/stores/roleStore';
import { toast } from 'sonner';
import type { TicketFormValues } from '@/lib/schemas';

export function CreateTicketPage() {
  const navigate = useNavigate();
  
  const createTicket = useTicketStore((state) => state.createTicket);
  const addLog = useRoleStore((state) => state.addLog);
  
  const handleBack = () => {
    navigate(-1);
  };
  
  const handleSubmit = (data: TicketFormValues) => {
    const newTicket = createTicket(data);
    
    // If assignee is provided, assign the ticket
    if (data.assigneeId) {
      const assignTicket = useTicketStore.getState().assignTicket;
      assignTicket(newTicket.id, data.assigneeId);
    }

    addLog('ticket.created', 'ticket', newTicket.id, newTicket.number, `Создана заявка: ${newTicket.title}`);
    toast.success('Заявка создана', {
      description: `Заявка ${newTicket.number} успешно создана`,
    });
    navigate('/tickets');
  };
  
  return (
    <CreateTicketScreen
      onBack={handleBack}
      onSubmit={handleSubmit}
    />
  );
}
