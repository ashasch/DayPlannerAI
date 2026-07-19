import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

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

export type UserRow = typeof users.$inferSelect;
export type PasswordResetTokenRow = typeof passwordResetTokens.$inferSelect;
