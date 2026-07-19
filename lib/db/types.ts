import type { IsoDate, Task, TaskDraft, TaskPriority } from '@/lib/tasks/types';

/** A persisted user. `passwordHash` is `null` for accounts created via OAuth only. */
export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  email: string;
  name: string;
  passwordHash: string | null;
}

/**
 * A password reset grant. Only the *hash* of the token is stored, so a leaked
 * database still cannot be used to reset anyone's password.
 */
export interface PasswordResetTokenRecord {
  tokenHash: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

/**
 * Raised by `UserRepository.create` when the email is already registered.
 *
 * Storage-layer concern deliberately kept out of `lib/errors`: the service
 * layer translates it into the user-facing `EMAIL_TAKEN` code, so repositories
 * stay independent of the HTTP/translation vocabulary.
 */
export class EmailAlreadyExistsError extends Error {
  constructor() {
    super('A user with this email already exists');
    this.name = 'EmailAlreadyExistsError';
  }
}

/**
 * Persistence contract for users.
 *
 * Backed by Postgres via Drizzle. Swapping the engine means writing one new
 * implementation of this interface and changing the factory in
 * `lib/db/index.ts` — no call site changes.
 */
export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  /** @throws {EmailAlreadyExistsError} When the address is already taken. */
  create(input: CreateUserInput): Promise<UserRecord>;
  updatePasswordHash(userId: string, passwordHash: string): Promise<void>;
}

/** Fields a caller may change on an existing task. */
export interface TaskPatch {
  title?: string;
  priority?: TaskPriority;
  category?: string | null;
  estimatedMinutes?: number | null;
  plannedDate?: IsoDate | null;
}

/**
 * Persistence contract for tasks.
 *
 * Every method takes `userId` and filters on it. Ownership is enforced in the
 * query rather than by a separate "does this belong to you" read, so there is
 * no window between the check and the write, and a guessed task id simply
 * matches no rows.
 */
export interface TaskRepository {
  listByUser(userId: string): Promise<Task[]>;
  /** Tasks with a `plannedDate` inside `[from, to]`, both inclusive. */
  listByUserInRange(userId: string, from: IsoDate, to: IsoDate): Promise<Task[]>;
  findById(userId: string, taskId: string): Promise<Task | null>;
  createMany(userId: string, drafts: TaskDraft[]): Promise<Task[]>;
  update(userId: string, taskId: string, patch: TaskPatch): Promise<Task | null>;
  delete(userId: string, taskId: string): Promise<boolean>;
}

/** Persistence contract for password reset grants. */
export interface PasswordResetTokenRepository {
  create(record: PasswordResetTokenRecord): Promise<void>;
  find(tokenHash: string): Promise<PasswordResetTokenRecord | null>;
  delete(tokenHash: string): Promise<void>;
  deleteAllForUser(userId: string): Promise<void>;
}
