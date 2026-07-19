import { NextResponse, type NextRequest } from 'next/server';

import { auth, signOut } from '@/auth';
import { AUTH_ROUTES } from '@/lib/auth/routes';
import { userRepository } from '@/lib/db';

/**
 * Clears a session whose user no longer exists.
 *
 * A JWT stays valid until it expires, so the middleware (which cannot reach the
 * Node-only data store from the Edge runtime) still sees a deleted account as
 * signed in. Redirecting such a request straight to `/login` would bounce back
 * off the "already signed in" rule and loop, so the cookie has to be destroyed
 * here — a Route Handler is the only place in this path allowed to write it.
 */
export async function GET(request: NextRequest) {
  const session = await auth();

  // Re-verify rather than trusting the caller: this endpoint must never be a
  // drive-by logout for a perfectly valid session.
  if (session?.user?.id) {
    const user = await userRepository.findById(session.user.id);

    if (user) {
      return NextResponse.redirect(new URL('/capture', request.nextUrl));
    }
  }

  await signOut({ redirect: false });

  return NextResponse.redirect(new URL(AUTH_ROUTES.login, request.nextUrl));
}
