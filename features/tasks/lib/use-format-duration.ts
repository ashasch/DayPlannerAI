'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';

import { splitDuration } from '@/lib/tasks/duration';

/**
 * Formats a minute count the way a person would say it.
 *
 * 45 → "45 хв", 120 → "2 год", 150 → "2 год 30 хв". Reading "150 хв" forces the
 * reader to do the division themselves, which is exactly the friction a day
 * planner should remove.
 */
export function useFormatDuration() {
  const t = useTranslations('tasks.duration');

  return useCallback(
    (totalMinutes: number | null | undefined): string => {
      if (typeof totalMinutes !== 'number' || totalMinutes <= 0) return t('none');

      const { hours, minutes } = splitDuration(totalMinutes);

      if (hours === 0) return t('minutes', { count: minutes });
      if (minutes === 0) return t('hours', { count: hours });

      return t('hoursMinutes', { hours, minutes });
    },
    [t],
  );
}
