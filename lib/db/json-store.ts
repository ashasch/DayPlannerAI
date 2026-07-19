import 'server-only';

import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { env } from '@/lib/env';

import type {
  CreateUserInput,
  PasswordResetTokenRecord,
  PasswordResetTokenRepository,
  UserRecord,
  UserRepository,
} from './types';

interface DatabaseShape {
  users: UserRecord[];
  passwordResetTokens: PasswordResetTokenRecord[];
}

const EMPTY_DATABASE: DatabaseShape = { users: [], passwordResetTokens: [] };

/**
 * A tiny JSON-file database for local development.
 *
 * Intentionally minimal: it exists so Stage 1 runs with zero infrastructure.
 * It is *not* meant for production — see `lib/db/index.ts` for how to swap in a
 * real database without touching any calling code.
 */
class JsonDatabase {
  private readonly filePath: string;

  /**
   * Serialises all reads/writes into a single promise chain. Node's fs is
   * async, so two overlapping registrations could otherwise read the same
   * snapshot and clobber each other on write.
   */
  private queue: Promise<unknown> = Promise.resolve();

  constructor(dataDir: string) {
    this.filePath = path.resolve(process.cwd(), dataDir, 'db.json');
  }

  /** Runs `operation` exclusively, giving it the current snapshot to mutate. */
  async transaction<T>(operation: (db: DatabaseShape) => Promise<T> | T): Promise<T> {
    const run = this.queue.then(async () => {
      const db = await this.read();
      const result = await operation(db);
      await this.write(db);
      return result;
    });

    // Keep the chain alive even if this operation rejects.
    this.queue = run.catch(() => undefined);

    return run;
  }

  private async read(): Promise<DatabaseShape> {
    try {
      const raw = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<DatabaseShape>;

      return {
        users: parsed.users ?? [],
        passwordResetTokens: parsed.passwordResetTokens ?? [],
      };
    } catch {
      // Missing or corrupted file — start from a clean slate.
      return structuredClone(EMPTY_DATABASE);
    }
  }

  /** Writes atomically via a temp file + rename so a crash cannot truncate the db. */
  private async write(db: DatabaseShape): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });

    const tempPath = `${this.filePath}.${randomUUID()}.tmp`;
    await writeFile(tempPath, JSON.stringify(db, null, 2), 'utf8');
    await rename(tempPath, this.filePath);
  }
}

// Reuse one instance across hot reloads so the write queue is not lost.
const globalForDb = globalThis as unknown as { __dayPlannerDb?: JsonDatabase };
const database = (globalForDb.__dayPlannerDb ??= new JsonDatabase(env.DATA_DIR));

/** Emails are compared case-insensitively and stored normalised. */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export class JsonUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<UserRecord | null> {
    const target = normaliseEmail(email);
    return database.transaction((db) => db.users.find((user) => user.email === target) ?? null);
  }

  async findById(id: string): Promise<UserRecord | null> {
    return database.transaction((db) => db.users.find((user) => user.id === id) ?? null);
  }

  async create(input: CreateUserInput): Promise<UserRecord> {
    return database.transaction((db) => {
      const now = new Date().toISOString();
      const user: UserRecord = {
        id: randomUUID(),
        email: normaliseEmail(input.email),
        name: input.name.trim(),
        passwordHash: input.passwordHash,
        createdAt: now,
        updatedAt: now,
      };

      db.users.push(user);
      return user;
    });
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    await database.transaction((db) => {
      const user = db.users.find((candidate) => candidate.id === userId);
      if (!user) return;

      user.passwordHash = passwordHash;
      user.updatedAt = new Date().toISOString();
    });
  }
}

export class JsonPasswordResetTokenRepository implements PasswordResetTokenRepository {
  async create(record: PasswordResetTokenRecord): Promise<void> {
    await database.transaction((db) => {
      db.passwordResetTokens.push(record);
    });
  }

  async find(tokenHash: string): Promise<PasswordResetTokenRecord | null> {
    return database.transaction(
      (db) => db.passwordResetTokens.find((token) => token.tokenHash === tokenHash) ?? null,
    );
  }

  async delete(tokenHash: string): Promise<void> {
    await database.transaction((db) => {
      db.passwordResetTokens = db.passwordResetTokens.filter(
        (token) => token.tokenHash !== tokenHash,
      );
    });
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await database.transaction((db) => {
      db.passwordResetTokens = db.passwordResetTokens.filter((token) => token.userId !== userId);
    });
  }
}
