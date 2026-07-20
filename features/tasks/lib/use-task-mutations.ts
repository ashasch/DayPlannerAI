'use client';

import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import type { IsoDate, Task, TaskPriority } from '@/lib/tasks/types';

import { deleteTask, updateTask } from './api';

type TasksState = Task[] | null;

/**
 * Task edits shared by the Inbox and the Calendar.
 *
 * Both screens hold their own `Task[]` and both need the same
 * optimistic-update-then-reconcile behaviour, so the logic lives here rather
 * than being written twice and drifting apart.
 *
 * Every mutation applies immediately, then replaces the row with whatever the
 * server returned — a single-field edit feels broken if the UI waits for a
 * round trip, but the reconcile keeps derived fields like `updatedAt` honest.
 * On failure the original row is restored and the user is told.
 */
export function useTaskMutations(setTasks: Dispatch<SetStateAction<TasksState>>) {
  const t = useTranslations('tasks.toasts');

  const replace = useCallback(
    (taskId: string, next: Task) => {
      setTasks((current) => current?.map((item) => (item.id === taskId ? next : item)) ?? null);
    },
    [setTasks],
  );

  const patch = useCallback(
    async (task: Task, changes: Partial<Task>, successMessage?: string) => {
      replace(task.id, { ...task, ...changes });

      try {
        const updated = await updateTask(task.id, changes);
        replace(task.id, updated);

        if (successMessage) toast.success(successMessage);
      } catch {
        // Restore the row exactly as it was before the optimistic edit.
        replace(task.id, task);
        toast.error(t('updateFailed'));
      }
    },
    [replace, t],
  );

  const setPlannedDate = useCallback(
    (task: Task, plannedDate: IsoDate | null) => {
      if (task.plannedDate === plannedDate) return Promise.resolve();

      return patch(task, { plannedDate }, plannedDate ? t('dateUpdated') : t('dateCleared'));
    },
    [patch, t],
  );

  const setCompleted = useCallback(
    (task: Task, completed: boolean) =>
      patch(task, { completed }, completed ? t('completed') : t('reopened')),
    [patch, t],
  );

  const setPriority = useCallback(
    (task: Task, priority: TaskPriority) => {
      if (task.priority === priority) return Promise.resolve();
      return patch(task, { priority }, t('priorityUpdated'));
    },
    [patch, t],
  );

  const remove = useCallback(
    async (task: Task) => {
      let snapshot: TasksState = null;

      setTasks((current) => {
        snapshot = current;
        return current?.filter((item) => item.id !== task.id) ?? null;
      });

      try {
        await deleteTask(task.id);
        toast.success(t('deleted'));
      } catch {
        setTasks(snapshot);
        toast.error(t('deleteFailed'));
      }
    },
    [setTasks, t],
  );

  return { setPlannedDate, setCompleted, setPriority, remove };
}
