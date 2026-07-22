import 'server-only';

import { and, eq } from 'drizzle-orm';

import type { IsoDate } from '@/lib/tasks/types';

import { getDb } from './client';
import { dashboardSummaries, type DashboardSummaryRow } from './schema';

export interface StoredSummary {
  content: string;
  model: string;
  locale: string;
  weekStart: IsoDate;
  generatedAt: string;
}

function toStored(row: DashboardSummaryRow): StoredSummary {
  return {
    content: row.content,
    model: row.model,
    locale: row.locale,
    weekStart: row.weekStart,
    generatedAt: row.generatedAt.toISOString(),
  };
}

export async function findSummary(
  userId: string,
  weekStart: IsoDate,
): Promise<StoredSummary | null> {
  const [row] = await getDb()
    .select()
    .from(dashboardSummaries)
    .where(and(eq(dashboardSummaries.userId, userId), eq(dashboardSummaries.weekStart, weekStart)))
    .limit(1);

  return row ? toStored(row) : null;
}

/**
 * Stores this week's summary, replacing any previous one.
 *
 * Upsert rather than insert: regenerating is expected, and the unique index on
 * (user, week) is what guarantees a single row even if two requests race.
 */
export async function saveSummary(input: {
  userId: string;
  weekStart: IsoDate;
  content: string;
  model: string;
  locale: string;
}): Promise<StoredSummary> {
  const [row] = await getDb()
    .insert(dashboardSummaries)
    .values(input)
    .onConflictDoUpdate({
      target: [dashboardSummaries.userId, dashboardSummaries.weekStart],
      set: {
        content: input.content,
        model: input.model,
        locale: input.locale,
        generatedAt: new Date(),
      },
    })
    .returning();

  if (!row) throw new Error('Upsert returned no row');

  return toStored(row);
}
