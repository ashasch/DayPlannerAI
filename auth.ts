import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { authConfig } from '@/auth.config';
import { loginSchema } from '@/lib/auth/schemas';
import { authenticateUser } from '@/lib/auth/user-service';

/**
 * Full Auth.js instance (Node runtime).
 *
 * Adding a social provider later is additive — drop `GitHub({...})` or
 * `Google({...})` into the `providers` array below and add the matching
 * environment variables; the session shape, middleware and UI stay as they are.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: 'credentials',
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      /**
       * Returns the user on success or `null` on failure. Auth.js turns `null`
       * into a `CredentialsSignin` error, which the login form maps to the
       * localised "invalid credentials" message.
       */
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await authenticateUser(parsed.data);
        if (!user) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
});
