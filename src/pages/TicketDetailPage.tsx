import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { TicketDetailScreen } from '@/screens/TicketDetailScreen';
import { useTicketStore } from '@/stores/ticketStore';
import { useRoleStore } from '@/stores/roleStore';
import { toast } from 'sonner';

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const selectedTicket = useTicketStore((state) => state.selectedTicket);
  const getTicketById = useTicketStore((state) => state.getTicketById);
  const setSelectedTicket = useTicketStore((state) => state.setSelectedTicket);
  const updateTicketStatus = useTicketStore((state) => state.updateTicketStatus);
  const assignTicket = useTicketStore((state) => state.assignTicket);
  const addComment = useTicketStore((state) => state.addComment);
  const getAvailableAssignees = useTicketStore((state) => state.getAvailableAssignees);
  
  const hasPermission = useRoleStore((state) => state.hasPermission);
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
    navigate('/tickets');
  };
  
  const handleStatusChange = (ticketId: string, status: any) => {
    updateTicketStatus(ticketId, status);
    const statusLabels: Record<string, string> = {
      new: 'Новая', 
      in_progress: 'В работе', 
      waiting: 'Ожидание',
      resolved: 'Решена', 
      cancelled: 'Отменена',
    };
    addLog('ticket.status_changed', 'ticket', ticketId, undefined, `Статус изменен на "${statusLabels[status]}"`);
    toast.success('Статус обновлен', {
      description: `Заявка переведена в статус "${statusLabels[status]}"`,
    });
  };
  
  const handleAddComment = (ticketId: string, text: string) => {
    addComment(ticketId, text);
    addLog('ticket.comment_added', 'ticket', ticketId, undefined, 'Добавлен комментарий');
    toast.success('Комментарий добавлен');
  };
  
  const handleEdit = () => {
    if (!hasPermission('tickets', 'edit')) {
      toast.error('Нет прав', { description: 'У вас нет прав для редактирования заявок' });
      return;
    }
    navigate(`/tickets/${selectedTicket.id}/edit`);
  };
  
  const handleAssign = (ticketId: string, assigneeId: string) => {
    if (!assigneeId) {
      assignTicket(ticketId, '');
      addLog('ticket.unassigned', 'ticket', ticketId, undefined, 'Исполнитель снят');
      toast.success('Исполнитель снят');
    } else {
      assignTicket(ticketId, assigneeId);
      const assignee = getAvailableAssignees().find(u => u.id === assigneeId);
      addLog('ticket.assigned', 'ticket', ticketId, undefined, `Назначен исполнитель: ${assignee?.name}`);
      toast.success('Исполнитель назначен', {
        description: assignee ? `${assignee.name} назначен исполнителем` : undefined,
      });
    }
  };
  
  return (
    <TicketDetailScreen
      ticket={selectedTicket}
      onBack={handleBack}
      onStatusChange={handleStatusChange}
      onAddComment={handleAddComment}
      onEdit={handleEdit}
      onAssign={handleAssign}
      availableAssignees={getAvailableAssignees()}
    />
  );
}
