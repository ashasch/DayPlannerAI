'use client';

import { useTranslations } from 'next-intl';
import { Clock, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { IsoDate, Task } from '@/lib/tasks/types';
import { cn } from '@/lib/utils';

import { PriorityBadge } from './priority-badge';
import { TaskDateBadge } from './task-date-badge';
import { TaskDatePicker } from './task-date-picker';

interface TaskCardProps {
  task: Task;
  onChangeDate: (date: IsoDate | null) => void;
  onDelete: () => void;
  /** Dims the card while its update is in flight. */
  isPending?: boolean;
  className?: string;
}

/** A saved task in the Inbox, with inline rescheduling and deletion. */
export function TaskCard({ task, onChangeDate, onDelete, isPending, className }: TaskCardProps) {
  const t = useTranslations('tasks.actions');

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-opacity',
        isPending && 'opacity-50',
        className,
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-pretty text-sm font-medium leading-snug">{task.title}</p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {task.category ? <span>{task.category}</span> : null}
          {task.estimatedMinutes ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" aria-hidden />
              {task.estimatedMinutes}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {task.plannedDate ? <TaskDateBadge date={task.plannedDate} /> : null}
        <PriorityBadge priority={task.priority} />

        <TaskDatePicker value={task.plannedDate} onChange={onChangeDate} disabled={isPending} />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          disabled={isPending}
          aria-label={t('delete')}
          title={t('delete')}
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
