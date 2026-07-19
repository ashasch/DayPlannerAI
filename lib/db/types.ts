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

/** Persistence contract for password reset grants. */
export interface PasswordResetTokenRepository {
  create(record: PasswordResetTokenRecord): Promise<void>;
  find(tokenHash: string): Promise<PasswordResetTokenRecord | null>;
  delete(tokenHash: string): Promise<void>;
  deleteAllForUser(userId: string): Promise<void>;
}
