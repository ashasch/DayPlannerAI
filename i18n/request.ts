import { getRequestConfig } from 'next-intl/server';

import { resolveLocale } from '@/lib/i18n/locale';

/**
 * next-intl request configuration.
 *
 * The app deliberately does not use locale-prefixed routes: the locale lives in
 * a cookie, which keeps URLs clean and lets the switcher swap languages via a
 * router refresh instead of a navigation/reload.
 */
export default getRequestConfig(async () => {
  const locale = await resolveLocale();

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    now: new Date(),
  };
});
