'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Clock, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PriorityPicker } from '@/features/tasks/components/priority-badge';
import { TaskCheckbox } from '@/features/tasks/components/task-checkbox';
import { TaskDateBadge } from '@/features/tasks/components/task-date-badge';
import { TaskDatePicker } from '@/features/tasks/components/task-date-picker';
import type { IsoDate, Task, TaskPriority } from '@/lib/tasks/types';
import { cn } from '@/lib/utils';

interface TaskDetailDialogProps {
  /** `null` closes the dialog. */
  task: Task | null;
  onClose: () => void;
  onChangeDate: (date: IsoDate | null) => void;
  onToggleCompleted: (completed: boolean) => void;
  onChangePriority: (priority: TaskPriority) => void;
}

/**
 * Details for a task clicked in the calendar.
 *
 * Also the keyboard-accessible route to rescheduling: drag & drop is
 * pointer-only, so this dialog (and the Inbox picker) is how the same action
 * stays reachable without a mouse.
 */
export function TaskDetailDialog({
  task,
  onClose,
  onChangeDate,
  onToggleCompleted,
  onChangePriority,
}: TaskDetailDialogProps) {
  const t = useTranslations('tasks.details');
  const tActions = useTranslations('tasks.actions');
  const closeRef = useRef<HTMLButtonElement>(null);

  const isOpen = task !== null;

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    // Move focus into the dialog so keyboard users are not left behind on the
    // calendar grid.
    closeRef.current?.focus();

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Rendered conditionally rather than through AnimatePresence.
  //
  // The dialog contains a Radix dropdown (its own portal + presence machinery),
  // and nesting that inside an exiting AnimatePresence subtree left the exit
  // never reporting completion: the backdrop stayed mounted at opacity 0,
  // invisibly covering the page and swallowing every click. Losing the 200ms
  // close animation is a fair trade for a dialog that reliably goes away.
  if (!task) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        role="dialog"
        aria-modal="true"
        aria-label={t('title')}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl"
        // Clicks inside must not reach the backdrop's close handler.
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <TaskCheckbox
              completed={task.completed}
              onToggle={onToggleCompleted}
              className="mt-1"
            />
            <h2
              className={cn(
                'text-pretty text-base font-medium leading-snug',
                task.completed && 'text-muted-foreground line-through',
              )}
            >
              {task.title}
            </h2>
          </div>

          <Button
            ref={closeRef}
            type="button"
            variant="ghost"
            size="icon"
            className="-mr-1 -mt-1 size-8 shrink-0 text-muted-foreground"
            onClick={onClose}
            aria-label={tActions('cancel')}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>

        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{t('priorityLabel')}</dt>
            <dd>
              <PriorityPicker priority={task.priority} onChange={onChangePriority} />
            </dd>
          </div>

          {task.category ? (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">{t('categoryLabel')}</dt>
              <dd className="text-sm">{task.category}</dd>
            </div>
          ) : null}

          {task.estimatedMinutes ? (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">
                <Clock className="inline size-3.5 align-[-2px]" aria-hidden />
              </dt>
              <dd className="text-sm tabular-nums">{task.estimatedMinutes}</dd>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{t('dateLabel')}</dt>
            <dd className="flex items-center gap-2">
              {task.plannedDate ? <TaskDateBadge date={task.plannedDate} /> : null}
              <TaskDatePicker value={task.plannedDate} onChange={onChangeDate} />
            </dd>
          </div>
        </dl>
      </motion.div>
    </motion.div>
  );
}
