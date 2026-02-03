import { useState } from 'react';
import type { TicketCategory, TicketPriority } from '@/types';
import { categoryLabels, priorityLabels } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateTicketScreenProps {
  onBack: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    category: TicketCategory;
    priority: TicketPriority;
  }) => void;
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

export function CreateTicketScreen({ onBack, onSubmit }: CreateTicketScreenProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>('hardware');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) return;
    
    setIsSubmitting(true);
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
    });
  };

  const isValid = title.trim().length > 0 && description.trim().length > 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 px-4 py-3 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Новая заявка</h1>
      </div>

      <div className="p-4 space-y-6 max-w-2xl mx-auto">
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
        <div className="pt-4">
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="w-full h-12 text-base font-medium"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Создание...
              </span>
            ) : (
              'Создать заявку'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
