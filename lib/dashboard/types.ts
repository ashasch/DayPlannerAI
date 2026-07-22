import type { IsoDate } from '@/lib/tasks/types';

/** Which tasks feed the statistics. */
export const DASHBOARD_SCOPES = ['all', 'completed'] as const;
export type DashboardScope = (typeof DASHBOARD_SCOPES)[number];

/** Preset reporting windows, plus a user-supplied range. */
export const DASHBOARD_PERIODS = ['all', 'week', 'month', 'custom'] as const;
export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number];

/** How many weeks of history the heatmap shows (~6 months). */
export const HEATMAP_WEEKS = 26;

export interface CategoryStat {
  /** `null` is rendered as "no category" rather than dropped. */
  category: string | null;
  taskCount: number;
  totalMinutes: number;
}

export interface WeekdayStat {
  /** 0 = Monday … 6 = Sunday, matching the calendar's week layout. */
  weekday: number;
  taskCount: number;
  totalMinutes: number;
}

export interface HeatmapDay {
  date: IsoDate;
  completedCount: number;
}

export interface DashboardTotals {
  taskCount: number;
  totalMinutes: number;
  completedCount: number;
  /** 0–100, rounded. `0` when there are no tasks in the period. */
  completionRate: number;
  /** Category with the most tasks, or `null` when there is no data. */
  busiestCategory: string | null;
}

export interface DashboardStats {
  totals: DashboardTotals;
  byCategory: CategoryStat[];
  byWeekday: WeekdayStat[];
  /** Always the trailing `HEATMAP_WEEKS`, independent of the period filter. */
  heatmap: HeatmapDay[];
}

export interface WeeklySummary {
  content: string;
  model: string;
  generatedAt: string;
  weekStart: IsoDate;
  /** True when this came from the cache rather than a fresh inference call. */
  cached: boolean;
}
