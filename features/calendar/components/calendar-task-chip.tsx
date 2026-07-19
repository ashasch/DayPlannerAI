'use client';

import type { TaskPriority } from '@/lib/tasks/types';
import { cn } from '@/lib/utils';

/** Left border colour carries priority without spending horizontal space. */
const PRIORITY_ACCENT: Record<TaskPriority, string> = {
  high: 'border-l-destructive',
  medium: 'border-l-foreground/40',
  low: 'border-l-border',
};

interface CalendarTaskChipProps {
  title: string;
  priority: TaskPriority;
  onClick: () => void;
  dragProps?: Record<string, unknown>;
  isDragging?: boolean;
  className?: string;
}

/** A single task inside a calendar day cell. */
export function CalendarTaskChip({
  title,
  priority,
  onClick,
  dragProps,
  isDragging,
  className,
}: CalendarTaskChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full cursor-grab truncate rounded-md border-l-2 bg-secondary/60 px-1.5 py-1 text-left text-[11px] leading-tight',
        'transition-colors hover:bg-secondary active:cursor-grabbing',
        PRIORITY_ACCENT[priority],
        isDragging && 'opacity-40',
        className,
      )}
      title={title}
      {...dragProps}
    >
      {title}
    </button>
  );
}
