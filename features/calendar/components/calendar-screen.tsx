'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchTasksInRange } from '@/features/tasks/lib/api';
import { useTaskMutations } from '@/features/tasks/lib/use-task-mutations';
import {
  addDays,
  addMonths,
  getMonthGrid,
  getWeekDays,
  startOfMonth,
  startOfWeek,
  toIsoDate,
} from '@/lib/date';
import { LOCALE_TO_BCP47, type Locale } from '@/lib/i18n/config';
import type { IsoDate, Task } from '@/lib/tasks/types';
import { cn } from '@/lib/utils';

import { MonthView } from './month-view';
import { TaskDetailDialog } from './task-detail-dialog';
import { WeekView } from './week-view';

export type CalendarMode = 'week' | 'month';

/**
 * Calendar of scheduled tasks.
 *
 * Only tasks with a `plannedDate` appear here; undated ones stay in the Inbox
 * by design, so the calendar always reflects real commitments.
 */
export function CalendarScreen() {
  const t = useTranslations('calendar');
  const locale = useLocale() as Locale;
  const bcp47 = LOCALE_TO_BCP47[locale];

  const [mode, setMode] = useState<CalendarMode>('week');
  const [anchor, setAnchor] = useState(() => new Date());
  const [tasks, setTasks] = useState<Task[] | null>(null);

  /**
   * The dialog tracks an id, not a task object.
   *
   * Holding a copy would freeze the dialog on the values it opened with, so
   * ticking the checkbox inside it would leave the strike-through and the
   * priority badge showing the old state until it was reopened.
   */
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const mutations = useTaskMutations(setTasks);

  // The visible window drives the query, so navigating fetches exactly the
  // range on screen instead of pulling every task the user has ever created.
  const { from, to, days, weeks } = useMemo(() => {
    if (mode === 'week') {
      const weekDays = getWeekDays(anchor);
      return {
        from: toIsoDate(weekDays[0]!),
        to: toIsoDate(weekDays[6]!),
        days: weekDays,
        weeks: null,
      };
    }

    const grid = getMonthGrid(anchor);
    return {
      from: toIsoDate(grid[0]![0]!),
      to: toIsoDate(grid[5]![6]!),
      days: null,
      weeks: grid,
    };
  }, [mode, anchor]);

  useEffect(() => {
    const controller = new AbortController();
    setTasks(null);

    fetchTasksInRange(from, to, controller.signal)
      .then(setTasks)
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof DOMException && error.name === 'AbortError') return;

        toast.error(t('loadFailed'));
        setTasks([]);
      });

    return () => controller.abort();
  }, [from, to, t]);

  /** Groups the window's tasks by day once, instead of filtering per cell. */
  const tasksByDate = useMemo(() => {
    const map = new Map<IsoDate, Task[]>();

    for (const task of tasks ?? []) {
      if (!task.plannedDate) continue;

      const bucket = map.get(task.plannedDate);
      if (bucket) bucket.push(task);
      else map.set(task.plannedDate, [task]);
    }

    return map;
  }, [tasks]);

  const step = useCallback(
    (direction: -1 | 1) => {
      setAnchor((current) =>
        mode === 'week' ? addDays(current, direction * 7) : addMonths(current, direction),
      );
    },
    [mode],
  );

  /** Always the live row, so the dialog re-renders as the task changes. */
  const selectedTask = useMemo(
    () => tasks?.find((task) => task.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId],
  );

  const periodLabel = useMemo(() => {
    if (mode === 'month') {
      return anchor.toLocaleDateString(bcp47, { month: 'long', year: 'numeric' });
    }

    const start = startOfWeek(anchor);
    const end = addDays(start, 6);
    const sameMonth = start.getMonth() === end.getMonth();

    const startLabel = start.toLocaleDateString(bcp47, {
      day: 'numeric',
      ...(sameMonth ? {} : { month: 'short' }),
    });
    const endLabel = end.toLocaleDateString(bcp47, { day: 'numeric', month: 'short' });

    return `${startLabel} — ${endLabel}`;
  }, [mode, anchor, bcp47]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
      <header className="mb-6 space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t('title')}</h1>
          <p className="max-w-xl text-pretty text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => step(-1)}
              aria-label={t('previous')}
              title={t('previous')}
            >
              <ChevronLeft className="size-4" aria-hidden />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => step(1)}
              aria-label={t('next')}
              title={t('next')}
            >
              <ChevronRight className="size-4" aria-hidden />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAnchor(new Date())}
              className="ml-1"
            >
              {t('today')}
            </Button>

            <span className="ml-2 text-sm font-medium capitalize">{periodLabel}</span>
          </div>

          <div
            role="tablist"
            aria-label={t('title')}
            className="inline-flex rounded-lg border border-border p-0.5"
          >
            {(['week', 'month'] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={mode === value}
                onClick={() => {
                  setMode(value);
                  // Re-anchor so the new view opens on a period that contains
                  // the day the user was already looking at.
                  setAnchor((current) =>
                    value === 'month' ? startOfMonth(current) : startOfWeek(current),
                  );
                }}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  mode === value
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t(value)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {tasks === null ? (
        <Skeleton className="h-[28rem] w-full rounded-2xl" />
      ) : mode === 'week' && days ? (
        <WeekView
          days={days}
          tasksByDate={tasksByDate}
          onSelect={(task) => setSelectedTaskId(task.id)}
          onDrop={(task, date) => void mutations.setPlannedDate(task, date)}
          onToggleCompleted={(task, completed) => void mutations.setCompleted(task, completed)}
        />
      ) : weeks ? (
        <MonthView
          weeks={weeks}
          anchor={anchor}
          tasksByDate={tasksByDate}
          onSelect={(task) => setSelectedTaskId(task.id)}
          onDrop={(task, date) => void mutations.setPlannedDate(task, date)}
          onToggleCompleted={(task, completed) => void mutations.setCompleted(task, completed)}
        />
      ) : null}

      <TaskDetailDialog
        task={selectedTask}
        onClose={() => setSelectedTaskId(null)}
        onToggleCompleted={(completed) => {
          if (selectedTask) void mutations.setCompleted(selectedTask, completed);
        }}
        onChangePriority={(priority) => {
          if (selectedTask) void mutations.setPriority(selectedTask, priority);
        }}
        onChangeEstimate={(minutes) => {
          if (selectedTask) void mutations.setEstimatedMinutes(selectedTask, minutes);
        }}
        onChangeDate={(date) => {
          if (selectedTask) void mutations.setPlannedDate(selectedTask, date);
          // The task may move outside the loaded window, leaving the dialog
          // pointing at a row that is no longer here.
          setSelectedTaskId(null);
        }}
      />
    </div>
  );
}
