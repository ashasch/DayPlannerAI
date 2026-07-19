'use client';

import { useLocale, useTranslations } from 'next-intl';
import { CalendarDays } from 'lucide-react';

import { daysFromToday, fromIsoDate } from '@/lib/date';
import { LOCALE_TO_BCP47, type Locale } from '@/lib/i18n/config';
import type { IsoDate } from '@/lib/tasks/types';
import { cn } from '@/lib/utils';

interface TaskDateBadgeProps {
  date: IsoDate;
  className?: string;
}

/**
 * Shows a task's planned day.
 *
 * Nearby days read as "Today"/"Tomorrow" because that is how people think about
 * them; anything further out falls back to a short weekday + date. Overdue days
 * are tinted so they stand out in a long Inbox.
 */
export function TaskDateBadge({ date, className }: TaskDateBadgeProps) {
  const t = useTranslations('tasks.date');
  const locale = useLocale() as Locale;

  const offset = daysFromToday(date);
  const label = formatLabel(date, offset, LOCALE_TO_BCP47[locale], t);

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium',
        offset < 0
          ? 'border-destructive/40 bg-destructive/10 text-destructive'
          : offset === 0
            ? 'border-foreground/25 bg-foreground/10 text-foreground'
            : 'border-border bg-secondary text-secondary-foreground',
        className,
      )}
    >
      <CalendarDays className="size-3" aria-hidden />
      {label}
    </span>
  );
}

function formatLabel(
  date: IsoDate,
  offset: number,
  bcp47: string,
  t: (key: 'today' | 'tomorrow' | 'yesterday') => string,
): string {
  if (offset === 0) return t('today');
  if (offset === 1) return t('tomorrow');
  if (offset === -1) return t('yesterday');

  const parsed = fromIsoDate(date);
  const sameYear = parsed.getFullYear() === new Date().getFullYear();

  return parsed.toLocaleDateString(bcp47, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    // Only spell out the year when it is not the current one.
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}
