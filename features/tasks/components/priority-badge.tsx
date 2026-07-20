'use client';

import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TASK_PRIORITIES, type TaskPriority } from '@/lib/tasks/types';
import { cn } from '@/lib/utils';

/** Visual weight per priority — high reads as urgent without shouting. */
const PRIORITY_STYLES: Record<TaskPriority, string> = {
  high: 'border-destructive/40 bg-destructive/10 text-destructive',
  medium: 'border-border bg-secondary text-secondary-foreground',
  low: 'border-border bg-transparent text-muted-foreground',
};

/** Sort order so the day's most important work surfaces first. */
export const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

const BADGE_BASE =
  'shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap';

export function PriorityBadge({
  priority,
  className,
}: {
  priority: TaskPriority;
  className?: string;
}) {
  const t = useTranslations('tasks.priority');

  return (
    <span className={cn(BADGE_BASE, PRIORITY_STYLES[priority], className)}>{t(priority)}</span>
  );
}

interface PriorityPickerProps {
  priority: TaskPriority;
  onChange: (priority: TaskPriority) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * The priority badge, made editable.
 *
 * Clicking the badge itself opens the menu — there is no separate control, so
 * the thing that shows the value is the thing that changes it.
 */
export function PriorityPicker({ priority, onChange, disabled, className }: PriorityPickerProps) {
  const t = useTranslations('tasks.priority');
  const tActions = useTranslations('tasks.actions');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          type="button"
          aria-label={tActions('changePriority')}
          title={tActions('changePriority')}
          onClick={(event) => event.stopPropagation()}
          className={cn(
            BADGE_BASE,
            PRIORITY_STYLES[priority],
            'cursor-pointer transition-opacity hover:opacity-80 disabled:pointer-events-none disabled:opacity-50',
            className,
          )}
        >
          {t(priority)}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[10rem]">
        <DropdownMenuLabel>{tActions('changePriority')}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {TASK_PRIORITIES.map((value) => (
          <DropdownMenuItem
            key={value}
            onSelect={() => onChange(value)}
            className="justify-between"
          >
            <span>{t(value)}</span>
            {value === priority ? <Check className="size-4" aria-hidden /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
