'use client';

import { PRIORITY_ACCENT_BORDER } from '@/features/tasks/components/priority-badge';
import { TaskCheckbox } from '@/features/tasks/components/task-checkbox';
import type { Task } from '@/lib/tasks/types';
import { cn } from '@/lib/utils';

interface CalendarTaskChipProps {
  task: Task;
  onOpen: () => void;
  onToggleCompleted: (completed: boolean) => void;
  dragProps?: Record<string, unknown>;
  isDragging?: boolean;
  className?: string;
}

/**
 * A single task inside a calendar day cell.
 *
 * The row is a div rather than a button because it contains its own checkbox —
 * nesting an interactive control inside a button is invalid HTML and breaks
 * keyboard semantics. The title carries the click-to-open behaviour instead.
 */
export function CalendarTaskChip({
  task,
  onOpen,
  onToggleCompleted,
  dragProps,
  isDragging,
  className,
}: CalendarTaskChipProps) {
  return (
    <div
      className={cn(
        'flex w-full cursor-grab items-center gap-1 rounded-md border-l-2 bg-secondary/60 px-1.5 py-1',
        'transition-colors hover:bg-secondary active:cursor-grabbing',
        PRIORITY_ACCENT_BORDER[task.priority],
        task.completed && 'opacity-60',
        isDragging && 'opacity-40',
        className,
      )}
      {...dragProps}
    >
      <TaskCheckbox completed={task.completed} onToggle={onToggleCompleted} size="sm" />

      <button
        type="button"
        onClick={onOpen}
        title={task.title}
        className={cn(
          'min-w-0 flex-1 truncate text-left text-[11px] leading-tight',
          task.completed && 'text-muted-foreground line-through',
        )}
      >
        {task.title}
      </button>
    </div>
  );
}
