import NextAuth from 'next-auth';

import { authConfig } from '@/auth.config';

/**
 * Route protection.
 *
 * Uses the Edge-safe config (no providers, no Node APIs) so the middleware
 * stays within the Edge runtime's constraints. All access decisions live in the
 * `authorized` callback of `auth.config.ts`.
 */
export default NextAuth(authConfig).auth;

export const config = {
  // Skip Next internals, the auth API itself, and anything with a file extension.
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
