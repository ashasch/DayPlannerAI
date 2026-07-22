import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { TASK_PRIORITIES } from '@/lib/tasks/types';

/**
 * Database schema (Drizzle ORM).
 *
 * Column names are snake_case in Postgres and camelCase in TypeScript, which is
 * why every column carries an explicit SQL name.
 */

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),

  /**
   * Stored already lower-cased by the repository. The unique index is what
   * actually prevents duplicate accounts under concurrent registration — the
   * "does this email exist" read alone would race.
   */
  email: text('email').notNull().unique(),

  name: text('name').notNull(),

  /** `null` for accounts that only ever signed in through an OAuth provider. */
  passwordHash: text('password_hash'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    /** SHA-256 of the token. The raw value only ever exists in the user's inbox. */
    tokenHash: text('token_hash').primaryKey(),

    userId: uuid('user_id')
      .notNull()
      // Deleting an account must not strand its reset grants.
      .references(() => users.id, { onDelete: 'cascade' }),

    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // `deleteAllForUser` runs on every reset request and every completed reset.
    index('password_reset_tokens_user_id_idx').on(table.userId),
  ],
);

export const taskPriority = pgEnum('task_priority', TASK_PRIORITIES);

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    title: text('title').notNull(),
    priority: taskPriority('priority').notNull().default('medium'),
    category: text('category'),
    estimatedMinutes: integer('estimated_minutes'),

    /**
     * The day this task is planned for, or `null` when unscheduled.
     *
     * A `date` column, not a timestamp: the value is a calendar day, so it must
     * not shift when the user (or the server) is in another timezone. Drizzle
     * hands this back as a plain `YYYY-MM-DD` string.
     */
    plannedDate: date('planned_date'),

    /** Done tasks stay visible everywhere — they are dimmed, never filtered out. */
    completed: boolean('completed').notNull().default(false),

    /**
     * When the task was actually ticked off, or `null` while it is open.
     *
     * `completed` alone cannot answer "how many did I finish on Tuesday?" — the
     * dashboard heatmap needs the moment, not just the flag. Kept in sync by
     * the repository rather than by a trigger, so the rule lives with the code
     * that owns the column.
     */
    completedAt: timestamp('completed_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Inbox: every task for a user, newest first.
    index('tasks_user_id_idx').on(table.userId),
    // Calendar: one user's tasks within a date window.
    index('tasks_user_id_planned_date_idx').on(table.userId, table.plannedDate),
    // Dashboard heatmap: one user's completions over a date window.
    index('tasks_user_id_completed_at_idx').on(table.userId, table.completedAt),
  ],
);

/**
 * Cached weekly AI summaries.
 *
 * One row per user per ISO week, so reopening the dashboard never costs an
 * inference call — the summary is only recomputed when the user asks for it or
 * the week rolls over.
 */
export const dashboardSummaries = pgTable(
  'dashboard_summaries',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    /** Monday of the week the summary covers, as `YYYY-MM-DD`. */
    weekStart: date('week_start').notNull(),

    content: text('content').notNull(),
    model: text('model').notNull(),
    locale: text('locale').notNull(),

    generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // At most one cached summary per user per week; regeneration overwrites it.
    uniqueIndex('dashboard_summaries_user_week_idx').on(table.userId, table.weekStart),
  ],
);

export type UserRow = typeof users.$inferSelect;
export type PasswordResetTokenRow = typeof passwordResetTokens.$inferSelect;
export type TaskRow = typeof tasks.$inferSelect;
export type DashboardSummaryRow = typeof dashboardSummaries.$inferSelect;
