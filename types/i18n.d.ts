import type messages from '../messages/uk.json';
import type { LOCALES } from '../lib/i18n/config';

/**
 * Gives `useTranslations` / `getTranslations` autocomplete and compile-time
 * checking for every message key. Ukrainian is the source of truth, so a key
 * missing from `en.json` surfaces as a runtime warning rather than silently
 * rendering the key.
 */
declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof LOCALES)[number];
    Messages: typeof messages;
  }
}
