import 'server-only';

import { and, asc, desc, eq, gte, isNotNull, lte } from 'drizzle-orm';

import type { IsoDate, Task, TaskDraft } from '@/lib/tasks/types';

import { getDb } from './client';
import { tasks, type TaskRow } from './schema';
import type { TaskPatch, TaskRepository } from './types';

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    priority: row.priority,
    category: row.category,
    estimatedMinutes: row.estimatedMinutes,
    plannedDate: row.plannedDate,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class PostgresTaskRepository implements TaskRepository {
  async listByUser(userId: string): Promise<Task[]> {
    const rows = await getDb()
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt));

    return rows.map(toTask);
  }

  async listByUserInRange(userId: string, from: IsoDate, to: IsoDate): Promise<Task[]> {
    const rows = await getDb()
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          // Unscheduled tasks belong to the Inbox only, never the calendar.
          isNotNull(tasks.plannedDate),
          gte(tasks.plannedDate, from),
          lte(tasks.plannedDate, to),
        ),
      )
      .orderBy(asc(tasks.plannedDate), asc(tasks.createdAt));

    return rows.map(toTask);
  }

  async findById(userId: string, taskId: string): Promise<Task | null> {
    const [row] = await getDb()
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.id, taskId)))
      .limit(1);

    return row ? toTask(row) : null;
  }

  async createMany(userId: string, drafts: TaskDraft[]): Promise<Task[]> {
    if (drafts.length === 0) return [];

    const rows = await getDb()
      .insert(tasks)
      .values(
        drafts.map((draft) => ({
          userId,
          title: draft.title,
          priority: draft.priority,
          category: draft.category,
          estimatedMinutes: draft.estimatedMinutes,
          plannedDate: draft.plannedDate,
        })),
      )
      .returning();

    return rows.map(toTask);
  }

  /**
   * Applies a partial update.
   *
   * Returns `null` when no row matched — which covers both "no such task" and
   * "belongs to someone else", so the caller cannot tell the two apart.
   */
  async update(userId: string, taskId: string, patch: TaskPatch): Promise<Task | null> {
    // An update with no columns would be invalid SQL; treat it as a plain read.
    if (Object.keys(patch).length === 0) {
      return this.findById(userId, taskId);
    }

    const [row] = await getDb()
      .update(tasks)
      .set({ ...patch, updatedAt: new Date() })
      .where(and(eq(tasks.userId, userId), eq(tasks.id, taskId)))
      .returning();

    return row ? toTask(row) : null;
  }

  async delete(userId: string, taskId: string): Promise<boolean> {
    const rows = await getDb()
      .delete(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.id, taskId)))
      .returning({ id: tasks.id });

    return rows.length > 0;
  }
}
