import 'server-only';

import { cookies, headers } from 'next/headers';

import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE_NAME, type Locale } from './config';

/**
 * Resolves the active locale for the current request.
 *
 * Priority: explicit cookie choice → `Accept-Language` negotiation → default.
 * Keeping negotiation server-side means the first paint is already localised,
 * so there is no flash of the wrong language.
 */
export async function resolveLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE_NAME)?.value;

  if (isLocale(fromCookie)) {
    return fromCookie;
  }

  const headerList = await headers();
  const acceptLanguage = headerList.get('accept-language');

  return negotiateLocale(acceptLanguage) ?? DEFAULT_LOCALE;
}

/**
 * Picks the highest-quality locale from an `Accept-Language` header that the
 * app actually supports. Returns `null` when nothing matches.
 */
export function negotiateLocale(acceptLanguage: string | null): Locale | null {
  if (!acceptLanguage) return null;

  const ranked = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag = '', ...params] = part.trim().split(';');
      const qualityParam = params.find((param) => param.trim().startsWith('q='));
      const quality = qualityParam ? Number.parseFloat(qualityParam.split('=')[1] ?? '1') : 1;

      return { tag: tag.trim().toLowerCase(), quality: Number.isNaN(quality) ? 0 : quality };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of ranked) {
    const base = tag.split('-')[0];
    if (isLocale(base)) return base;
  }

  return null;
}
