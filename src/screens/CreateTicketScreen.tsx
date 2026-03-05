import { useMemo } from 'react';
import type { TicketCategory, TicketPriority } from '@/types';
import { categoryLabels, priorityLabels } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Check, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRoleStore } from '@/stores/roleStore';
import { useTicketStore } from '@/stores/ticketStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ticketSchema, type TicketFormValues } from '@/lib/schemas';

interface CreateTicketScreenProps {
  onBack: () => void;
  onSubmit: (data: TicketFormValues) => void;
}

export function CreateTicketScreen({ onBack, onSubmit }: CreateTicketScreenProps) {
  const currentUser = useRoleStore((state) => state.currentUser());
  // Use useMemo to prevent infinite loop from getAvailableAssignees returning a new array
  const getAvailableAssignees = useTicketStore((state) => state.getAvailableAssignees);
  const users = useMemo(() => getAvailableAssignees(), [getAvailableAssignees]);
  
  const canAssign = currentUser?.roleId === 'admin';

  const assignableUsers = useMemo(() => {
    return users.filter(user => 
      ['admin', 'technician'].includes(user.role)
    );
  }, [users]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      category: 'hardware',
      priority: 'medium',
      assigneeId: '',
    },
  });

  const selectedCategory = watch('category');
  const selectedPriority = watch('priority');
  const selectedAssigneeId = watch('assigneeId');

  const onFormSubmit = (data: TicketFormValues) => {
    onSubmit({
      ...data,
      assigneeId: canAssign && data.assigneeId ? data.assigneeId : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 px-4 py-4 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-700">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Новая заявка</h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        {/* Form */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Описание проблемы</h2>
            
            <div className="space-y-2">
              <Label htmlFor="title">Заголовок</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Кратко опишите проблему"
                className={cn("bg-slate-50 dark:bg-slate-900", errors.title && "border-red-500")}
              />
              {errors.title && <span className="text-xs text-red-500">{errors.title.message}</span>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Подробное описание</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Опишите детали проблемы, чтобы мы могли быстрее помочь"
                className={cn("bg-slate-50 dark:bg-slate-900 min-h-[120px]", errors.description && "border-red-500")}
              />
              {errors.description && <span className="text-xs text-red-500">{errors.description.message}</span>}
            </div>
          </div>

          {/* Details */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Детали заявки</h2>
            
            <div className="space-y-2">
              <Label>Категория</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {(Object.keys(categoryLabels) as TicketCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setValue('category', cat)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors text-center border',
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                    )}
                  >
                    {categoryLabels[cat]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Приоритет</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(Object.keys(priorityLabels) as TicketPriority[]).map((prio) => (
                  <button
                    key={prio}
                    type="button"
                    onClick={() => setValue('priority', prio)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors text-center border relative',
                      selectedPriority === prio
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                    )}
                  >
                    {priorityLabels[prio]}
                    {selectedPriority === prio && (
                      <div className="absolute top-1 right-1">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Assignee - Only for Admin */}
          {canAssign && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Исполнитель</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setValue('assigneeId', '')}
                  className={cn(
                    'px-4 py-3 rounded-lg text-sm font-medium transition-all text-left flex items-center gap-2',
                    !selectedAssigneeId
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300'
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <span>Не назначен</span>
                </button>
                
                {assignableUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setValue('assigneeId', user.id)}
                    className={cn(
                      'px-4 py-3 rounded-lg text-sm font-medium transition-all text-left flex items-center gap-2',
                      selectedAssigneeId === user.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300'
                    )}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold uppercase">
                      {user.name.substring(0, 2)}
                    </div>
                    <div className="flex flex-col">
                      <span>{user.name}</span>
                      <span className={cn("text-xs", selectedAssigneeId === user.id ? "text-blue-100" : "text-slate-400")}>
                        {user.role === 'admin' ? 'Администратор' : 'Техник'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg rounded-xl shadow-lg shadow-blue-600/20"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Создание...' : 'Создать заявку'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
