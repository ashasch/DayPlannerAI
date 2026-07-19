'use client';

import { useLocale, useTranslations } from 'next-intl';

import { PRIORITY_RANK } from '@/features/tasks/components/priority-badge';
import { getWeekDays, isSameMonth, toIsoDate, todayIso } from '@/lib/date';
import { LOCALE_TO_BCP47, type Locale } from '@/lib/i18n/config';
import type { IsoDate, Task } from '@/lib/tasks/types';
import { cn } from '@/lib/utils';

import { CalendarTaskChip } from './calendar-task-chip';
import { useDayDrop } from './use-day-drop';

interface MonthViewProps {
  weeks: Date[][];
  anchor: Date;
  tasksByDate: Map<IsoDate, Task[]>;
  onSelect: (task: Task) => void;
  onDrop: (task: Task, date: IsoDate) => void;
}

/** Tasks shown per day before collapsing into a "+N more" counter. */
const MAX_VISIBLE_PER_DAY = 3;

/** A six-week month grid with a compact task list in each day. */
export function MonthView({ weeks, anchor, tasksByDate, onSelect, onDrop }: MonthViewProps) {
  const t = useTranslations('calendar');
  const locale = useLocale() as Locale;
  const bcp47 = LOCALE_TO_BCP47[locale];
  const today = todayIso();

  const { draggedTask, overDate, getTaskDragProps, getDayDropProps } = useDayDrop(onDrop);

  // Weekday headers come from a real week, so they follow the Monday-first
  // ordering and the active locale instead of being hard-coded.
  const weekdayLabels = getWeekDays(new Date()).map((day) =>
    day.toLocaleDateString(bcp47, { weekday: 'short' }),
  );

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[44rem]">
        <div className="mb-1 grid grid-cols-7 gap-2">
          {weekdayLabels.map((label) => (
            <div
              key={label}
              className="px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weeks.flat().map((day) => {
            const iso = toIsoDate(day);
            const isToday = iso === today;
            const inMonth = isSameMonth(day, anchor);

            const dayTasks = (tasksByDate.get(iso) ?? [])
              .slice()
              .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);

            const visible = dayTasks.slice(0, MAX_VISIBLE_PER_DAY);
            const hidden = dayTasks.length - visible.length;

            return (
              <div
                key={iso}
                {...getDayDropProps(iso)}
                className={cn(
                  'flex min-h-[7.5rem] flex-col rounded-lg border p-1.5 transition-colors',
                  isToday ? 'border-foreground/30' : 'border-border',
                  // Padding days stay visible but recede, so the month's shape
                  // reads at a glance.
                  inMonth ? 'bg-card' : 'bg-transparent opacity-45',
                  overDate === iso && 'border-foreground/60 bg-accent opacity-100',
                )}
              >
                <div className="mb-1 flex justify-end px-0.5">
                  <span
                    className={cn(
                      'text-xs tabular-nums',
                      isToday
                        ? 'flex size-5 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background'
                        : 'text-muted-foreground',
                    )}
                  >
                    {day.getDate()}
                  </span>
                </div>

                <div className="flex-1 space-y-0.5">
                  {visible.map((task) => (
                    <CalendarTaskChip
                      key={task.id}
                      title={task.title}
                      priority={task.priority}
                      onClick={() => onSelect(task)}
                      dragProps={getTaskDragProps(task)}
                      isDragging={draggedTask?.id === task.id}
                    />
                  ))}

                  {hidden > 0 ? (
                    <p className="px-1 text-[10px] font-medium text-muted-foreground">
                      {t('moreTasks', { count: hidden })}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
