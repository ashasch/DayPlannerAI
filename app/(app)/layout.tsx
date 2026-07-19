import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { AppHeader } from '@/components/layout/app-header';
import { AUTH_ROUTES } from '@/lib/auth/routes';
import { userRepository } from '@/lib/db';

/**
 * Shell for authenticated routes.
 *
 * The middleware already blocks requests without a session, but a JWT stays
 * valid until it expires — so a deleted account would otherwise keep access for
 * the rest of the token's lifetime. Re-reading the user here makes protected
 * pages fail closed, and means the header always shows current details rather
 * than whatever was true when the token was minted.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(AUTH_ROUTES.login);
  }

  const user = await userRepository.findById(session.user.id);

  if (!user) {
    // Hand off to the endpoint that can actually destroy the cookie. Redirecting
    // to /login directly would loop: the middleware still sees a valid JWT and
    // would send us right back here.
    redirect('/api/auth/stale-session');
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader user={{ name: user.name, email: user.email }} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
