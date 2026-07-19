import 'server-only';

import { JsonPasswordResetTokenRepository, JsonUserRepository } from './json-store';
import type { PasswordResetTokenRepository, UserRepository } from './types';

/**
 * Composition root for persistence.
 *
 * To move to a real database, implement `UserRepository` /
 * `PasswordResetTokenRepository` against it and swap the two constructors
 * below. Nothing else in the codebase imports a concrete implementation.
 */
export const userRepository: UserRepository = new JsonUserRepository();
export const passwordResetTokenRepository: PasswordResetTokenRepository =
  new JsonPasswordResetTokenRepository();

export type * from './types';
