import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { User } from '@/types';
import { TicketDetailScreen } from '@/screens/TicketDetailScreen';
import { useTicketStore } from '@/stores/ticketStore';
import { useRoleStore } from '@/stores/roleStore';
import { toast } from 'sonner';

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const selectedTicket = useTicketStore((state) => state.selectedTicket);
  const getTicketById = useTicketStore((state) => state.getTicketById);
  const setSelectedTicket = useTicketStore((state) => state.setSelectedTicket);
  const updateTicketStatus = useTicketStore((state) => state.updateTicketStatus);
  const updateTicket = useTicketStore((state) => state.updateTicket);
  const addComment = useTicketStore((state) => state.addComment);
  
  const hasPermission = useRoleStore((state) => state.hasPermission);
  const addLog = useRoleStore((state) => state.addLog);
  const users = useRoleStore((state) => state.users);
  
  useEffect(() => {
    async function loadTicket() {
      if (id) {
        setLoading(true);
        const ticket = await getTicketById(id);
        if (ticket) {
          setSelectedTicket(ticket);
        } else {
          toast.error('Заявка не найдена');
          navigate('/tickets');
        }
        setLoading(false);
      }
    }
    loadTicket();
  }, [id, getTicketById, setSelectedTicket, navigate]);
  
  if (loading || !selectedTicket) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  const handleBack = () => {
    navigate('/tickets');
  };
  
  const handleStatusChange = async (ticketId: string, status: any) => {
    await updateTicketStatus(ticketId, status);
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
  
  const handleAddComment = async (ticketId: string, text: string) => {
    await addComment(ticketId, text);
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
  
  const handleAssign = async (ticketId: string, assigneeId: string) => {
    if (!assigneeId) {
      await updateTicket(ticketId, { assigneeId: null });
      addLog('ticket.unassigned', 'ticket', ticketId, undefined, 'Исполнитель снят');
      toast.success('Исполнитель снят');
    } else {
      await updateTicket(ticketId, { assigneeId });
      const assignee = users.find((u: User) => u.id === assigneeId);
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
      availableAssignees={(users || []).filter((u: User) => u.role === 'technician' || u.role === 'admin')}
    />
  );
}
