import 'server-only';

import { eq } from 'drizzle-orm';

import { getDb } from './client';
import { normaliseEmail } from './email';
import { passwordResetTokens, users, type UserRow } from './schema';
import {
  EmailAlreadyExistsError,
  type CreateUserInput,
  type PasswordResetTokenRecord,
  type PasswordResetTokenRepository,
  type UserRecord,
  type UserRepository,
} from './types';

/** Postgres `unique_violation`. */
const UNIQUE_VIOLATION = '23505';

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === UNIQUE_VIOLATION
  );
}

/** Maps a database row onto the transport-friendly record used by the app. */
function toUserRecord(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.passwordHash,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class PostgresUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<UserRecord | null> {
    const [row] = await getDb()
      .select()
      .from(users)
      .where(eq(users.email, normaliseEmail(email)))
      .limit(1);

    return row ? toUserRecord(row) : null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const [row] = await getDb().select().from(users).where(eq(users.id, id)).limit(1);

    return row ? toUserRecord(row) : null;
  }

  /**
   * Inserts a new user.
   *
   * Relies on the unique index rather than a preceding existence check: two
   * simultaneous registrations for the same address would both pass a read-then-
   * write check, and only the database can settle that race.
   *
   * @throws {EmailAlreadyExistsError} When the address is already registered.
   */
  async create(input: CreateUserInput): Promise<UserRecord> {
    try {
      const [row] = await getDb()
        .insert(users)
        .values({
          email: normaliseEmail(input.email),
          name: input.name.trim(),
          passwordHash: input.passwordHash,
        })
        .returning();

      if (!row) {
        throw new Error('Insert returned no row');
      }

      return toUserRecord(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new EmailAlreadyExistsError();
      }
      throw error;
    }
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    await getDb()
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }
}

export class PostgresPasswordResetTokenRepository implements PasswordResetTokenRepository {
  async create(record: PasswordResetTokenRecord): Promise<void> {
    await getDb()
      .insert(passwordResetTokens)
      .values({
        tokenHash: record.tokenHash,
        userId: record.userId,
        expiresAt: new Date(record.expiresAt),
        createdAt: new Date(record.createdAt),
      });
  }

  async find(tokenHash: string): Promise<PasswordResetTokenRecord | null> {
    const [row] = await getDb()
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.tokenHash, tokenHash))
      .limit(1);

    if (!row) return null;

    return {
      tokenHash: row.tokenHash,
      userId: row.userId,
      expiresAt: row.expiresAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
    };
  }

  async delete(tokenHash: string): Promise<void> {
    await getDb().delete(passwordResetTokens).where(eq(passwordResetTokens.tokenHash, tokenHash));
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await getDb().delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
  }
}
