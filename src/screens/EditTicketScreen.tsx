import { useState, useEffect } from 'react';
import type { Ticket, TicketCategory, TicketPriority } from '@/types';
import { categoryLabels, priorityLabels } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface EditTicketScreenProps {
  ticket: Ticket;
  onBack: () => void;
  onUpdate: (ticketId: string, data: {
    title: string;
    description: string;
    category: TicketCategory;
    priority: TicketPriority;
  }) => void;
  onDelete: (ticketId: string) => void;
}

const categories: { id: TicketCategory; label: string }[] = [
  { id: 'hardware', label: categoryLabels.hardware },
  { id: 'software', label: categoryLabels.software },
  { id: 'network', label: categoryLabels.network },
  { id: 'printer', label: categoryLabels.printer },
  { id: 'other', label: categoryLabels.other },
];

const priorities: { id: TicketPriority; label: string; color: string }[] = [
  { id: 'low', label: priorityLabels.low, color: 'bg-slate-400' },
  { id: 'medium', label: priorityLabels.medium, color: 'bg-blue-500' },
  { id: 'high', label: priorityLabels.high, color: 'bg-amber-500' },
  { id: 'critical', label: priorityLabels.critical, color: 'bg-red-500' },
];

export function EditTicketScreen({ 
  ticket, 
  onBack, 
  onUpdate,
  onDelete 
}: EditTicketScreenProps) {
  const [title, setTitle] = useState(ticket.title);
  const [description, setDescription] = useState(ticket.description);
  const [category, setCategory] = useState<TicketCategory>(ticket.category);
  const [priority, setPriority] = useState<TicketPriority>(ticket.priority);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    setTitle(ticket.title);
    setDescription(ticket.description);
    setCategory(ticket.category);
    setPriority(ticket.priority);
  }, [ticket]);

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) return;
    
    setIsSubmitting(true);
    onUpdate(ticket.id, {
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
    });
  };

  const handleDelete = () => {
    onDelete(ticket.id);
    setShowDeleteDialog(false);
  };

  const isValid = title.trim().length > 0 && description.trim().length > 0;
  const hasChanges = 
    title !== ticket.title ||
    description !== ticket.description ||
    category !== ticket.category ||
    priority !== ticket.priority;

  return (
    <>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 px-4 py-3 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Редактировать заявку</h1>
          <div className="ml-auto">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Удалить
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-6 max-w-2xl mx-auto">
          {/* Ticket Number */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
            <span className="text-sm text-slate-500 dark:text-slate-400">Номер заявки:</span>
            <span className="ml-2 font-semibold text-slate-800 dark:text-slate-100">{ticket.number}</span>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Тема <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Краткое описание проблемы"
              className="h-12 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Описание <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Подробно опишите проблему..."
              className="min-h-[120px] resize-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Категория</Label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    'px-4 py-3 rounded-lg text-sm font-medium transition-all text-left',
                    category === cat.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Приоритет</Label>
            <div className="space-y-2">
              {priorities.map((prio) => (
                <button
                  key={prio.id}
                  onClick={() => setPriority(prio.id)}
                  className={cn(
                    'w-full px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-3',
                    priority === prio.id
                      ? 'bg-white dark:bg-slate-800 border-2 border-blue-600'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300'
                  )}
                >
                  <span className={cn('w-3 h-3 rounded-full', prio.color)} />
                  <span className={priority === prio.id ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}>
                    {prio.label}
                  </span>
                  {priority === prio.id && (
                    <Check className="w-4 h-4 text-blue-600 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 space-y-2">
            <Button
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting || !hasChanges}
              className="w-full h-12 text-base font-medium"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Сохранение...
                </span>
              ) : (
                'Сохранить изменения'
              )}
            </Button>
            {!hasChanges && (
              <p className="text-sm text-center text-slate-400 dark:text-slate-500">
                Нет изменений для сохранения
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить заявку?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить заявку {ticket.number}? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
