import { useState } from 'react';
import type { Ticket, TicketStatus, User } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityIndicator } from '@/components/PriorityIndicator';
import { categoryLabels, priorityLabels } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  Calendar, 
  User as UserIcon, 
  Tag, 
  MessageSquare, 
  Play, 
  CheckCircle, 
  Clock,
  XCircle,
  Send,
  Edit
} from 'lucide-react';
import { Label } from '@/components/ui/label';


interface TicketDetailScreenProps {
  ticket: Ticket;
  onBack: () => void;
  onStatusChange: (ticketId: string, status: TicketStatus) => void;
  onAddComment: (ticketId: string, text: string) => void;
  onEdit?: () => void;
  onAssign?: (ticketId: string, assigneeId: string) => void;
  availableAssignees?: User[];
}

export function TicketDetailScreen({ 
  ticket, 
  onBack, 
  onStatusChange,
  onAddComment,
  onEdit,
  onAssign,
  availableAssignees = []
}: TicketDetailScreenProps) {
  const [commentText, setCommentText] = useState('');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSubmitComment = () => {
    if (commentText.trim()) {
      onAddComment(ticket.id, commentText.trim());
      setCommentText('');
    }
  };

  const getActionButtons = () => {
    switch (ticket.status) {
      case 'new':
        return (
          <>
            <Button 
              onClick={() => onStatusChange(ticket.id, 'in_progress')}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Взять в работу
            </Button>
            <Button 
              variant="outline"
              onClick={() => onStatusChange(ticket.id, 'cancelled')}
              className="flex-1 dark:border-slate-600 dark:text-slate-300"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Отменить
            </Button>
          </>
        );
      case 'in_progress':
        return (
          <>
            <Button 
              onClick={() => onStatusChange(ticket.id, 'waiting')}
              variant="outline"
              className="flex-1 dark:border-slate-600 dark:text-slate-300"
            >
              <Clock className="w-4 h-4 mr-2" />
              В ожидание
            </Button>
            <Button 
              onClick={() => onStatusChange(ticket.id, 'resolved')}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Закрыть
            </Button>
          </>
        );
      case 'waiting':
        return (
          <>
            <Button 
              onClick={() => onStatusChange(ticket.id, 'in_progress')}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Вернуть в работу
            </Button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-4">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 px-4 py-3 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{ticket.number}</h1>
        </div>
        <StatusBadge status={ticket.status} />
        {onEdit && (
          <button
            onClick={onEdit}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            title="Редактировать"
          >
            <Edit className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Main Info Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">{ticket.title}</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-4">{ticket.description}</p>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500 dark:text-slate-400">Категория:</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">{categoryLabels[ticket.category]}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 flex justify-center">
                <PriorityIndicator priority={ticket.priority} />
              </div>
              <span className="text-slate-500 dark:text-slate-400">Приоритет:</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">{priorityLabels[ticket.priority]}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500 dark:text-slate-400">Создана:</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">{formatDate(ticket.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500 dark:text-slate-400">Автор:</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">{ticket.author.name}</span>
            </div>
          </div>

          {onAssign && availableAssignees.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 space-y-2">
              <Label className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                {ticket.assignee ? 'Исполнитель:' : 'Назначить исполнителя:'}
              </Label>
              <div className="flex gap-2">
                <Select
                  value={ticket.assignee?.id || ''}
                  onValueChange={(value) => {
                    onAssign(ticket.id, value || '');
                  }}
                >
                  <SelectTrigger className="flex-1 dark:bg-slate-700 dark:border-slate-600">
                    <SelectValue placeholder="Выберите исполнителя" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Не назначен</SelectItem>
                    {availableAssignees.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.department})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {ticket.status !== 'resolved' && ticket.status !== 'cancelled' && (
          <div className="flex gap-3">
            {getActionButtons()}
          </div>
        )}

        {/* Comments Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Комментарии</h3>
            <span className="text-sm text-slate-400 dark:text-slate-500">({ticket.comments.length})</span>
          </div>

          {/* Comment Input */}
          {ticket.status !== 'resolved' && ticket.status !== 'cancelled' && (
            <div className="mb-4">
              <div className="flex gap-2">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Добавить комментарий..."
                  className="flex-1 min-h-[80px] resize-none dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                />
              </div>
              <Button 
                onClick={handleSubmitComment}
                disabled={!commentText.trim()}
                className="mt-2 w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                Отправить
              </Button>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {ticket.comments.length === 0 ? (
              <p className="text-center text-slate-400 dark:text-slate-500 py-4">Нет комментариев</p>
            ) : (
              [...ticket.comments].reverse().map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {comment.author.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-slate-700 dark:text-slate-200">{comment.author.name}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{comment.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
