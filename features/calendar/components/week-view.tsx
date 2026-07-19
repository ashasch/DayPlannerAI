'use client';

import { useLocale, useTranslations } from 'next-intl';

import { PRIORITY_RANK } from '@/features/tasks/components/priority-badge';
import { toIsoDate, todayIso } from '@/lib/date';
import { LOCALE_TO_BCP47, type Locale } from '@/lib/i18n/config';
import type { IsoDate, Task } from '@/lib/tasks/types';
import { cn } from '@/lib/utils';

import { CalendarTaskChip } from './calendar-task-chip';
import { useDayDrop } from './use-day-drop';

interface WeekViewProps {
  days: Date[];
  tasksByDate: Map<IsoDate, Task[]>;
  onSelect: (task: Task) => void;
  onDrop: (task: Task, date: IsoDate) => void;
}

/**
 * Seven day columns.
 *
 * Scrolls horizontally on narrow screens rather than collapsing to a list —
 * the whole point of the week view is seeing the days side by side, and a
 * stacked version would just be the Inbox again.
 */
export function WeekView({ days, tasksByDate, onSelect, onDrop }: WeekViewProps) {
  const t = useTranslations('calendar');
  const locale = useLocale() as Locale;
  const bcp47 = LOCALE_TO_BCP47[locale];
  const today = todayIso();

  const { draggedTask, overDate, getTaskDragProps, getDayDropProps } = useDayDrop(onDrop);

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[44rem] grid-cols-7 gap-2">
        {days.map((day) => {
          const iso = toIsoDate(day);
          const isToday = iso === today;
          const dayTasks = (tasksByDate.get(iso) ?? [])
            .slice()
            .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);

          return (
            <div
              key={iso}
              {...getDayDropProps(iso)}
              className={cn(
                'flex min-h-[18rem] flex-col rounded-xl border bg-card p-2 transition-colors',
                isToday ? 'border-foreground/30' : 'border-border',
                overDate === iso && 'border-foreground/60 bg-accent',
              )}
            >
              <div className="mb-2 flex items-baseline justify-between gap-1 px-1">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {day.toLocaleDateString(bcp47, { weekday: 'short' })}
                </span>
                <span
                  className={cn(
                    'text-sm tabular-nums',
                    isToday
                      ? 'flex size-6 items-center justify-center rounded-full bg-foreground font-semibold text-background'
                      : 'text-muted-foreground',
                  )}
                >
                  {day.getDate()}
                </span>
              </div>

              <div className="flex-1 space-y-1">
                {dayTasks.map((task) => (
                  <CalendarTaskChip
                    key={task.id}
                    title={task.title}
                    priority={task.priority}
                    onClick={() => onSelect(task)}
                    dragProps={getTaskDragProps(task)}
                    isDragging={draggedTask?.id === task.id}
                  />
                ))}

                {dayTasks.length === 0 ? (
                  <p className="px-1 pt-1 text-[11px] text-muted-foreground/50">{t('empty')}</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
