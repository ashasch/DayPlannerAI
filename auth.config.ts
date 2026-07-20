import type { NextAuthConfig } from 'next-auth';

import {
  AUTH_ROUTES,
  DEFAULT_SIGNED_IN_REDIRECT,
  isProtectedPath,
  isPublicAuthPath,
} from '@/lib/auth/routes';

/**
 * Edge-safe Auth.js configuration.
 *
 * The middleware runs on the Edge runtime, which cannot load bcrypt or the
 * Node `fs` based store. Keeping the providers array empty here — and adding
 * the real Credentials provider only in `auth.ts` (Node runtime) — is the
 * documented Auth.js split. Adding Google/GitHub later means pushing an
 * OAuth provider into `auth.ts`; nothing in this file has to change.
 */
export const authConfig = {
  // JWT sessions keep the middleware stateless — no DB round-trip per request.
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 30 },

  pages: {
    signIn: AUTH_ROUTES.login,
    error: AUTH_ROUTES.login,
  },

  providers: [],

  callbacks: {
    /**
     * Gatekeeper for the middleware.
     *
     * Returning `false` sends the visitor to the sign-in page; returning a
     * `Response` performs an explicit redirect.
     */
    authorized({ auth, request }) {
      const isSignedIn = Boolean(auth?.user);
      const { pathname, search } = request.nextUrl;

      if (isPublicAuthPath(pathname)) {
        if (isSignedIn) {
          return Response.redirect(new URL(DEFAULT_SIGNED_IN_REDIRECT, request.nextUrl));
        }
        return true;
      }

      if (isProtectedPath(pathname)) {
        if (isSignedIn) return true;

        // Preserve where the user was heading so we can return them after login.
        const loginUrl = new URL(AUTH_ROUTES.login, request.nextUrl);
        loginUrl.searchParams.set('callbackUrl', `${pathname}${search}`);
        return Response.redirect(loginUrl);
      }

      return true;
    },

    /** Copies the stable user id onto the token at sign-in time. */
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },

    /**
     * Mirrors the token's user id onto the session exposed to the app.
     *
     * `JWT` carries an index signature of `unknown`, so the id is re-checked
     * here rather than trusted from a declaration merge.
     */
    session({ session, token }) {
      const userId = typeof token.id === 'string' ? token.id : token.sub;

      if (userId && session.user) {
        session.user.id = userId;
      }

      return session;
    },
  },
} satisfies NextAuthConfig;
