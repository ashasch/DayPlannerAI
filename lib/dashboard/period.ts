import {
  addDays,
  addMonths,
  fromIsoDate,
  isValidIsoDate,
  startOfMonth,
  startOfWeek,
  toIsoDate,
  todayIso,
} from '@/lib/date';
import type { IsoDate } from '@/lib/tasks/types';

import { HEATMAP_WEEKS, type DashboardPeriod } from './types';

export interface ResolvedRange {
  /** `null` on either end means unbounded. */
  from: IsoDate | null;
  to: IsoDate | null;
}

/**
 * Turns a period preset into concrete bounds.
 *
 * `today` comes from the browser: on Vercel the server runs in UTC, so
 * resolving "this week" server-side would put a Kyiv user in the wrong week for
 * the last few hours of every Sunday.
 */
export function resolvePeriod(
  period: DashboardPeriod,
  today: string | undefined,
  custom: { from?: string; to?: string },
): ResolvedRange {
  const anchorIso = today && isValidIsoDate(today) ? today : todayIso();
  const anchor = fromIsoDate(anchorIso);

  switch (period) {
    case 'week': {
      const start = startOfWeek(anchor);
      return { from: toIsoDate(start), to: toIsoDate(addDays(start, 6)) };
    }

    case 'month': {
      const start = startOfMonth(anchor);
      // Last day of this month = day before the first of next month.
      const end = addDays(startOfMonth(addMonths(start, 1)), -1);
      return { from: toIsoDate(start), to: toIsoDate(end) };
    }

    case 'custom':
      return { from: custom.from ?? null, to: custom.to ?? null };

    case 'all':
    default:
      return { from: null, to: null };
  }
}

/** Trailing window for the heatmap, ending today and starting on a Monday. */
export function resolveHeatmapRange(today: string | undefined): {
  from: IsoDate;
  to: IsoDate;
} {
  const anchorIso = today && isValidIsoDate(today) ? today : todayIso();
  const anchor = fromIsoDate(anchorIso);

  // Start on a Monday so the grid's rows line up as whole weeks.
  const start = startOfWeek(addDays(anchor, -7 * (HEATMAP_WEEKS - 1)));

  return { from: toIsoDate(start), to: anchorIso };
}

/** Monday of the week containing `today` — the cache key for weekly summaries. */
export function currentWeekStart(today: string | undefined): IsoDate {
  const anchorIso = today && isValidIsoDate(today) ? today : todayIso();
  return toIsoDate(startOfWeek(fromIsoDate(anchorIso)));
}
