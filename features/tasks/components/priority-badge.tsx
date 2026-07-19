'use client';

import { useTranslations } from 'next-intl';

import type { TaskPriority } from '@/lib/tasks/types';
import { cn } from '@/lib/utils';

/** Visual weight per priority — high reads as urgent without shouting. */
const PRIORITY_STYLES: Record<TaskPriority, string> = {
  high: 'border-destructive/40 bg-destructive/10 text-destructive',
  medium: 'border-border bg-secondary text-secondary-foreground',
  low: 'border-border bg-transparent text-muted-foreground',
};

export function PriorityBadge({
  priority,
  className,
}: {
  priority: TaskPriority;
  className?: string;
}) {
  const t = useTranslations('tasks.priority');

  return (
    <span
      className={cn(
        'shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-medium',
        PRIORITY_STYLES[priority],
        className,
      )}
    >
      {t(priority)}
    </span>
  );
}

/** Sort order so the day's most important work surfaces first. */
export const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
