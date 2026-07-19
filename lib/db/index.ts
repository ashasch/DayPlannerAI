import 'server-only';

import {
  PostgresPasswordResetTokenRepository,
  PostgresUserRepository,
} from './postgres-repository';
import { PostgresTaskRepository } from './task-repository';
import type { PasswordResetTokenRepository, TaskRepository, UserRepository } from './types';

/**
 * Composition root for persistence.
 *
 * To move to a different engine, implement `UserRepository` /
 * `PasswordResetTokenRepository` against it and swap the two constructors
 * below. Nothing else in the codebase imports a concrete implementation.
 */
export const userRepository: UserRepository = new PostgresUserRepository();
export const passwordResetTokenRepository: PasswordResetTokenRepository =
  new PostgresPasswordResetTokenRepository();
export const taskRepository: TaskRepository = new PostgresTaskRepository();

export { normaliseEmail } from './email';
export { EmailAlreadyExistsError } from './types';
export type * from './types';
