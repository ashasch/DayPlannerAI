/**
 * Route constants shared by the middleware, the auth config and the UI.
 *
 * Edge-safe: no Node APIs, no server-only imports.
 */

export const AUTH_ROUTES = {
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
} as const;

/** Where a user lands after a successful sign-in. */
export const DEFAULT_SIGNED_IN_REDIRECT = '/capture';

/** Routes that only make sense while signed out. */
export const PUBLIC_AUTH_ROUTES: readonly string[] = Object.values(AUTH_ROUTES);

/** Everything under these prefixes requires an authenticated session. */
export const PROTECTED_ROUTE_PREFIXES: readonly string[] = [
  '/capture',
  '/inbox',
  '/calendar',
  '/dashboard',
];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isPublicAuthPath(pathname: string): boolean {
  return PUBLIC_AUTH_ROUTES.includes(pathname);
}
