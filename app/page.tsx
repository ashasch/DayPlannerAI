import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { AUTH_ROUTES, DEFAULT_SIGNED_IN_REDIRECT } from '@/lib/auth/routes';

/** Entry point: straight into Capture when signed in, otherwise to sign-in. */
export default async function HomePage() {
  const session = await auth();

  redirect(session?.user ? DEFAULT_SIGNED_IN_REDIRECT : AUTH_ROUTES.login);
}
