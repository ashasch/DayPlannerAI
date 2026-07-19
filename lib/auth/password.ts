import 'server-only';

import { randomBytes } from 'node:crypto';

import { compare, hash } from 'bcryptjs';

/** bcrypt work factor. 12 is a reasonable 2020s default for interactive logins. */
const SALT_ROUNDS = 12;

export function hashPassword(plainPassword: string): Promise<string> {
  return hash(plainPassword, SALT_ROUNDS);
}

/**
 * Verifies a password against a stored hash.
 *
 * When `passwordHash` is `null` (e.g. an OAuth-only account) this still runs a
 * bcrypt comparison against a dummy hash so the response time does not reveal
 * whether the account exists or has a password set.
 */
export async function verifyPassword(
  plainPassword: string,
  passwordHash: string | null,
): Promise<boolean> {
  if (!passwordHash) {
    await compare(plainPassword, await getDummyHash());
    return false;
  }

  return compare(plainPassword, passwordHash);
}

/**
 * bcrypt hash of a random string, computed once on first use and reused
 * thereafter. Comparing against it burns the same CPU time as a real check.
 */
let dummyHashPromise: Promise<string> | null = null;

function getDummyHash(): Promise<string> {
  dummyHashPromise ??= hash(randomBytes(32).toString('hex'), SALT_ROUNDS);
  return dummyHashPromise;
}
