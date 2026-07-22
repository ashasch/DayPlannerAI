import { z } from 'zod';

import { isValidIsoDate } from '@/lib/date';

import { DASHBOARD_PERIODS, DASHBOARD_SCOPES } from './types';

const isoDate = z.string().refine(isValidIsoDate, { message: 'Expected YYYY-MM-DD' });

/**
 * Query for `GET /api/dashboard/stats`.
 *
 * A custom period must carry both ends, and they must be the right way round —
 * an inverted range would silently return an empty dashboard rather than an
 * error, which reads as "you have no tasks".
 */
export const dashboardQuerySchema = z
  .object({
    scope: z.enum(DASHBOARD_SCOPES).default('all'),
    period: z.enum(DASHBOARD_PERIODS).default('all'),
    from: isoDate.optional(),
    to: isoDate.optional(),
    /** The client's today, so "this week" means the user's week, not UTC's. */
    today: isoDate.optional(),
  })
  .refine((query) => query.period !== 'custom' || (query.from && query.to), {
    message: 'A custom period requires both `from` and `to`',
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: '`from` must not be after `to`',
  });

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;

/** Body for `POST /api/dashboard/summary`. */
export const summaryRequestSchema = z.object({
  /** Forces a fresh generation even when a cached summary exists. */
  regenerate: z.boolean().default(false),
  today: isoDate.optional(),
});
