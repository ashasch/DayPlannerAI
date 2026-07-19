import 'server-only';

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

import { passwordResetTokenRepository, userRepository, type UserRecord } from '@/lib/db';
import { normaliseEmail } from '@/lib/db/json-store';
import { AppError, ERROR_CODES } from '@/lib/errors';
import { isProduction } from '@/lib/env';
import { mailer } from '@/lib/mail/mailer';

import { hashPassword, verifyPassword } from './password';

/** Reset links stay valid for one hour. */
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

/** The subset of a user that is safe to put into a session or send to a client. */
export interface PublicUser {
  id: string;
  email: string;
  name: string;
}

export function toPublicUser(user: UserRecord): PublicUser {
  return { id: user.id, email: user.email, name: user.name };
}

/**
 * Registers a new email/password account.
 *
 * @throws {AppError} `EMAIL_TAKEN` when the address is already registered.
 */
export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<PublicUser> {
  const email = normaliseEmail(input.email);
  const existing = await userRepository.findByEmail(email);

  if (existing) {
    throw new AppError(ERROR_CODES.EMAIL_TAKEN, 409);
  }

  const user = await userRepository.create({
    email,
    name: input.name,
    passwordHash: await hashPassword(input.password),
  });

  return toPublicUser(user);
}

/**
 * Checks email/password credentials.
 *
 * Returns `null` for both "no such user" and "wrong password" so callers cannot
 * use the result to enumerate registered addresses.
 */
export async function authenticateUser(input: {
  email: string;
  password: string;
}): Promise<PublicUser | null> {
  const user = await userRepository.findByEmail(input.email);
  const isValid = await verifyPassword(input.password, user?.passwordHash ?? null);

  return user && isValid ? toPublicUser(user) : null;
}

/** Tokens are stored hashed; only the raw value ever reaches the user's inbox. */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Starts the password reset flow.
 *
 * Always resolves successfully — whether or not the address exists — so the
 * response cannot be used to discover which emails are registered.
 */
export async function requestPasswordReset(email: string, origin: string): Promise<void> {
  const user = await userRepository.findByEmail(email);
  if (!user) return;

  // Invalidate any outstanding links so only the newest one works.
  await passwordResetTokenRepository.deleteAllForUser(user.id);

  const token = randomBytes(32).toString('base64url');

  await passwordResetTokenRepository.create({
    tokenHash: hashToken(token),
    userId: user.id,
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString(),
    createdAt: new Date().toISOString(),
  });

  const resetUrl = `${origin}/reset-password?token=${token}`;

  await mailer.send({
    to: user.email,
    subject: 'AI Day Planner — password reset',
    text: `Hi ${user.name},\n\nUse the link below to set a new password. It expires in one hour.\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
  });

  if (!isProduction) {
    console.info(`[auth] Password reset link for ${user.email}: ${resetUrl}`);
  }
}

/**
 * Completes the password reset flow.
 *
 * @throws {AppError} `INVALID_TOKEN` when the token is unknown, expired, or the
 * referenced account no longer exists.
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const record = await passwordResetTokenRepository.find(hashToken(token));

  if (!record || !isTokenHashEqual(record.tokenHash, hashToken(token))) {
    throw new AppError(ERROR_CODES.INVALID_TOKEN, 400);
  }

  if (new Date(record.expiresAt).getTime() < Date.now()) {
    await passwordResetTokenRepository.delete(record.tokenHash);
    throw new AppError(ERROR_CODES.INVALID_TOKEN, 400);
  }

  const user = await userRepository.findById(record.userId);
  if (!user) {
    await passwordResetTokenRepository.delete(record.tokenHash);
    throw new AppError(ERROR_CODES.INVALID_TOKEN, 400);
  }

  await userRepository.updatePasswordHash(user.id, await hashPassword(newPassword));

  // Single-use: burn every outstanding token for this account.
  await passwordResetTokenRepository.deleteAllForUser(user.id);
}

/** Constant-time comparison of two hex digests of equal length. */
function isTokenHashEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, 'hex');
  const bufferB = Buffer.from(b, 'hex');

  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}
