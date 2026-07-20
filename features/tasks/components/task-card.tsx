'use client';

import { useTranslations } from 'next-intl';
import { Clock, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { IsoDate, Task, TaskPriority } from '@/lib/tasks/types';
import { cn } from '@/lib/utils';

import { PriorityPicker } from './priority-badge';
import { TaskCheckbox } from './task-checkbox';
import { TaskDateBadge } from './task-date-badge';
import { TaskDatePicker } from './task-date-picker';

interface TaskCardProps {
  task: Task;
  onToggleCompleted: (completed: boolean) => void;
  onChangePriority: (priority: TaskPriority) => void;
  onChangeDate: (date: IsoDate | null) => void;
  onDelete: () => void;
  /** Dims the card while its update is in flight. */
  isPending?: boolean;
  className?: string;
}

/** A saved task in the Inbox, with inline completion, priority, date and delete. */
export function TaskCard({
  task,
  onToggleCompleted,
  onChangePriority,
  onChangeDate,
  onDelete,
  isPending,
  className,
}: TaskCardProps) {
  const t = useTranslations('tasks.actions');

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-opacity',
        // Done tasks stay in the list, just visually receded. (60 not 55:
        // Tailwind's default opacity scale has no 55, so it emits no CSS.)
        task.completed && 'opacity-60',
        isPending && 'opacity-50',
        className,
      )}
    >
      <TaskCheckbox
        completed={task.completed}
        onToggle={onToggleCompleted}
        disabled={isPending}
        className="mt-0.5"
      />

      <div className="min-w-0 flex-1 space-y-1">
        <p
          className={cn(
            'text-pretty text-sm font-medium leading-snug',
            task.completed && 'text-muted-foreground line-through',
          )}
        >
          {task.title}
        </p>

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

        <PriorityPicker priority={task.priority} onChange={onChangePriority} disabled={isPending} />

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
