import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';

import { authConfig } from '@/auth.config';
import { loginSchema } from '@/lib/auth/schemas';
import { authenticateUser, findOrCreateOAuthUser } from '@/lib/auth/user-service';
import { env } from '@/lib/env';

/**
 * Builds the provider list for this deployment.
 *
 * OAuth providers are registered only when both their id and secret are set.
 * Auth.js throws at construction time on a half-configured provider, which
 * would take the whole auth route down — including email/password sign-in —
 * on any environment that has not been given OAuth credentials.
 */
function buildProviders(): NextAuthConfig['providers'] {
  const providers: NextAuthConfig['providers'] = [
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
  ];

  const githubId = env.GITHUB_CLIENT_ID;
  const githubSecret = env.GITHUB_CLIENT_SECRET;
  const googleId = env.GOOGLE_CLIENT_ID;
  const googleSecret = env.GOOGLE_CLIENT_SECRET;

  if (githubId && githubSecret) {
    providers.push(
      GitHub({
        clientId: githubId,
        clientSecret: githubSecret,
        // GitHub only returns a private email address with this scope, and the
        // provider resolves the *verified primary* one from it.
        authorization: { params: { scope: 'read:user user:email' } },
      }),
    );
  }

  if (googleId && googleSecret) {
    providers.push(
      Google({
        clientId: googleId,
        clientSecret: googleSecret,
        authorization: {
          params: {
            // Always show the account chooser instead of silently reusing
            // whichever Google session the browser happens to hold.
            prompt: 'select_account',
          },
        },
      }),
    );
  }

  return providers;
}

/**
 * Full Auth.js instance (Node runtime).
 *
 * The `jwt` callback is overridden here rather than in `auth.config.ts` because
 * it reads the database, which the Edge-runtime middleware cannot do.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: buildProviders(),
  callbacks: {
    ...authConfig.callbacks,

    /**
     * Resolves the token's `id` to *our* user row.
     *
     * For OAuth, `user.id` is the provider's account id — a GitHub or Google
     * identifier that means nothing to our database. Storing it would make the
     * protected-route check in `app/(app)/layout.tsx` fail to find the user and
     * bounce a perfectly valid sign-in straight back out. So on the first call
     * of an OAuth sign-in we look up (or create) the local account and put its
     * uuid on the token instead.
     */
    async jwt({ token, user, account, profile }) {
      if (!account || !user) return token;

      if (account.provider === 'credentials') {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        return token;
      }

      const localUser = await findOrCreateOAuthUser({
        email: user.email ?? (typeof profile?.email === 'string' ? profile.email : null),
        name: user.name,
        emailVerified: hasVerifiedEmail(account.provider, profile),
      });

      token.id = localUser.id;
      token.name = localUser.name;
      token.email = localUser.email;

      return token;
    },
  },
});

/**
 * Whether the provider vouches for the email address it returned.
 *
 * Google states this explicitly via `email_verified`. GitHub has no equivalent
 * claim in the profile, but the provider requests `user:email` and selects the
 * account's verified primary address, so reaching this point already implies a
 * confirmed address.
 */
function hasVerifiedEmail(provider: string, profile: unknown): boolean {
  if (provider === 'github') return true;

  if (provider === 'google') {
    return (
      typeof profile === 'object' &&
      profile !== null &&
      'email_verified' in profile &&
      profile.email_verified === true
    );
  }

  return false;
}
