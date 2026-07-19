'use server';

import { cookies } from 'next/headers';

import {
  isLocale,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
  type Locale,
} from '@/lib/i18n/config';
import { isProduction } from '@/lib/env';

/**
 * Persists the chosen UI language.
 *
 * Writing a cookie (rather than navigating to a locale-prefixed URL) is what
 * lets the switcher work without a page reload: the caller follows this with
 * `router.refresh()`, React re-renders the server tree with the new messages,
 * and client state — including anything typed into Capture — survives.
 */
export async function setLocaleAction(locale: Locale): Promise<{ ok: boolean }> {
  if (!isLocale(locale)) {
    return { ok: false };
  }

  const cookieStore = await cookies();

  cookieStore.set(LOCALE_COOKIE_NAME, locale, {
    maxAge: LOCALE_COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
    secure: isProduction,
  });

  return { ok: true };
}
