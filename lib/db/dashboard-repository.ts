import 'server-only';

import { and, eq, gte, isNotNull, lte, sql, type SQL } from 'drizzle-orm';

import type {
  CategoryStat,
  DashboardScope,
  DashboardStats,
  DashboardTotals,
  HeatmapDay,
  WeekdayStat,
} from '@/lib/dashboard/types';
import type { IsoDate } from '@/lib/tasks/types';

import { getDb } from './client';
import { tasks } from './schema';

export interface StatsFilter {
  userId: string;
  scope: DashboardScope;
  /** `null` on either end means "unbounded" — the all-time view. */
  from: IsoDate | null;
  to: IsoDate | null;
  /** IANA zone used to decide which local day a completion belongs to. */
  timeZone: string;
  heatmapFrom: IsoDate;
  heatmapTo: IsoDate;
}

/**
 * The day a task "belongs to" for period filtering.
 *
 * Planned date when it has one, creation date otherwise — without the fallback,
 * every unscheduled task would vanish the moment a period filter is applied,
 * and the Inbox backlog would look like it does not exist.
 */
const effectiveDate = sql`COALESCE(${tasks.plannedDate}, (${tasks.createdAt})::date)`;

/** Postgres returns `bigint`/`numeric` aggregates as strings. */
function toInt(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildConditions(filter: StatsFilter): SQL[] {
  const conditions: SQL[] = [eq(tasks.userId, filter.userId)];

  if (filter.scope === 'completed') {
    conditions.push(eq(tasks.completed, true));
  }

  if (filter.from) conditions.push(sql`${effectiveDate} >= ${filter.from}`);
  if (filter.to) conditions.push(sql`${effectiveDate} <= ${filter.to}`);

  return conditions;
}

/**
 * Aggregates a user's tasks for the dashboard.
 *
 * Four grouped queries rather than one pass in JavaScript: the point of the
 * dashboard is that it stays cheap as the task list grows, and pulling every
 * row to the client to sum it would defeat that. They run concurrently since
 * none depends on another.
 */
export async function getDashboardStats(filter: StatsFilter): Promise<DashboardStats> {
  const db = getDb();
  const where = and(...buildConditions(filter));

  /**
   * The local calendar day a completion falls on.
   *
   * Built once and reused verbatim in SELECT, WHERE and GROUP BY — see the
   * note on the grouping below for why they must match exactly. `::text` keeps
   * it a plain `YYYY-MM-DD` string instead of a driver `Date`, which would
   * re-introduce the timezone question this whole expression exists to settle.
   */
  const completionDay = sql<string>`((${tasks.completedAt} AT TIME ZONE ${filter.timeZone})::date)::text`;

  const [totalsRows, categoryRows, weekdayRows, heatmapRows] = await Promise.all([
    db
      .select({
        taskCount: sql<number>`count(*)`,
        totalMinutes: sql<number>`COALESCE(sum(${tasks.estimatedMinutes}), 0)`,
        completedCount: sql<number>`count(*) FILTER (WHERE ${tasks.completed})`,
      })
      .from(tasks)
      .where(where),

    db
      .select({
        category: tasks.category,
        taskCount: sql<number>`count(*)`,
        totalMinutes: sql<number>`COALESCE(sum(${tasks.estimatedMinutes}), 0)`,
      })
      .from(tasks)
      .where(where)
      .groupBy(tasks.category)
      .orderBy(sql`count(*) DESC`),

    db
      .select({
        // ISODOW is 1 (Monday) … 7 (Sunday); the UI is Monday-first and
        // zero-based, so shift here rather than in three components.
        weekday: sql<number>`EXTRACT(ISODOW FROM ${tasks.plannedDate}) - 1`,
        taskCount: sql<number>`count(*)`,
        totalMinutes: sql<number>`COALESCE(sum(${tasks.estimatedMinutes}), 0)`,
      })
      .from(tasks)
      // Weekday distribution is meaningless for unscheduled tasks.
      .where(and(where, isNotNull(tasks.plannedDate)))
      .groupBy(sql`EXTRACT(ISODOW FROM ${tasks.plannedDate})`),

    // The heatmap deliberately ignores the period filter — it is its own
    // fixed window — but still respects task ownership.
    db
      .select({ date: completionDay, completedCount: sql<number>`count(*)` })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, filter.userId),
          isNotNull(tasks.completedAt),
          gte(completionDay, filter.heatmapFrom),
          lte(completionDay, filter.heatmapTo),
        ),
      )
      // By output position, not by repeating the expression. Postgres matches
      // GROUP BY expressions structurally, and Drizzle renders the same
      // `sql` fragment differently here than in SELECT — unqualified vs
      // table-qualified column, and a fresh bind placeholder — so the two
      // never compare equal and the query fails with "must appear in the
      // GROUP BY clause". The ordinal has no such ambiguity.
      .groupBy(sql`1`),
  ]);

  const byCategory: CategoryStat[] = categoryRows.map((row) => ({
    category: row.category,
    taskCount: toInt(row.taskCount),
    totalMinutes: toInt(row.totalMinutes),
  }));

  const totalsRow = totalsRows[0];
  const taskCount = toInt(totalsRow?.taskCount);
  const completedCount = toInt(totalsRow?.completedCount);

  const totals: DashboardTotals = {
    taskCount,
    totalMinutes: toInt(totalsRow?.totalMinutes),
    completedCount,
    completionRate: taskCount === 0 ? 0 : Math.round((completedCount / taskCount) * 100),
    // Rows are already ordered by count, so the first named category wins.
    busiestCategory: byCategory.find((row) => row.category)?.category ?? null,
  };

  // Fill every weekday so the chart keeps seven bars even on a quiet week.
  const weekdayByIndex = new Map(weekdayRows.map((row) => [toInt(row.weekday), row]));
  const byWeekday: WeekdayStat[] = Array.from({ length: 7 }, (_, weekday) => {
    const row = weekdayByIndex.get(weekday);
    return {
      weekday,
      taskCount: toInt(row?.taskCount),
      totalMinutes: toInt(row?.totalMinutes),
    };
  });

  const heatmap: HeatmapDay[] = heatmapRows.map((row) => ({
    date: row.date,
    completedCount: toInt(row.completedCount),
  }));

  return { totals, byCategory, byWeekday, heatmap };
}

/** Compact per-category and per-weekday counts for one week, for the AI prompt. */
export async function getWeeklyDigest(
  userId: string,
  from: IsoDate,
  to: IsoDate,
): Promise<{ totals: DashboardTotals; byCategory: CategoryStat[]; byWeekday: WeekdayStat[] }> {
  const { totals, byCategory, byWeekday } = await getDashboardStats({
    userId,
    scope: 'all',
    from,
    to,
    timeZone: 'UTC',
    // The digest never reads the heatmap; keep its window empty so the query
    // matches nothing instead of scanning six months for nothing.
    heatmapFrom: to,
    heatmapTo: from,
  });

  return { totals, byCategory, byWeekday };
}
