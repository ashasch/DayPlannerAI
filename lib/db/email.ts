/**
 * Emails are compared case-insensitively and stored normalised, so the unique
 * index on `users.email` rejects `Ann@x.com` when `ann@x.com` already exists.
 */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}
