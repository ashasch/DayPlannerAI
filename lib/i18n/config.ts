/**
 * Shared i18n constants.
 *
 * This module is imported from the Edge runtime (middleware) as well as from
 * Server and Client Components, so it must stay free of Node-only APIs.
 */

export const LOCALES = ['uk', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

/** Ukrainian is the product's primary language. */
export const DEFAULT_LOCALE: Locale = 'uk';

/** Cookie that persists the chosen locale between sessions. */
export const LOCALE_COOKIE_NAME = 'dayplanner.locale';

/** One year — the locale choice should outlive the auth session. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** BCP-47 tags handed to the Web Speech API and `Intl` formatters. */
export const LOCALE_TO_BCP47: Record<Locale, string> = {
  uk: 'uk-UA',
  en: 'en-US',
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}
