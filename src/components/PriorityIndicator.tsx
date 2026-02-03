import type { TicketPriority } from '@/types';
import { priorityLabels, priorityColors } from '@/types';
import { cn } from '@/lib/utils';

interface PriorityIndicatorProps {
  priority: TicketPriority;
  showLabel?: boolean;
  className?: string;
}

export function PriorityIndicator({ priority, showLabel = false, className }: PriorityIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        className={cn(
          'w-2.5 h-2.5 rounded-full',
          priorityColors[priority]
        )}
      />
      {showLabel && (
        <span className="text-xs text-slate-500">{priorityLabels[priority]}</span>
      )}
    </div>
  );
}
