import type { TicketStatus } from '@/types';
import { statusLabels, statusColors } from '@/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white',
        statusColors[status],
        className
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
