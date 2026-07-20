import {
  ACCENTS,
  APPEARANCE_STORAGE_KEY,
  DEFAULT_ACCENT,
  DEFAULT_THEME,
  THEMES,
} from '@/lib/theme/config';

/**
 * Applies the stored appearance before the first paint.
 *
 * The server renders the defaults, which keeps the app usable with JavaScript
 * disabled. This script then corrects `<html>` synchronously in `<head>` — if
 * it ran as a normal effect instead, someone who picked the light theme would
 * see a full dark render flash first on every navigation.
 *
 * Written as a raw string because it must execute before React hydrates.
 */
export function AppearanceScript() {
  const script = `
(function () {
  try {
    var raw = localStorage.getItem(${JSON.stringify(APPEARANCE_STORAGE_KEY)});
    if (!raw) return;

    var saved = JSON.parse(raw);
    var root = document.documentElement;
    var themes = ${JSON.stringify(THEMES)};
    var accents = ${JSON.stringify(ACCENTS)};

    if (themes.indexOf(saved.theme) !== -1) {
      root.classList.toggle('dark', saved.theme === 'dark');
    }
    if (accents.indexOf(saved.accent) !== -1) {
      root.setAttribute('data-accent', saved.accent);
    }
  } catch (error) {
    /* Corrupt or unavailable storage: keep the server-rendered defaults. */
  }
})();
`.trim();

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

/** Defaults rendered on the server, corrected by the script above. */
export const SSR_APPEARANCE = {
  className: DEFAULT_THEME === 'dark' ? 'dark' : '',
  accent: DEFAULT_ACCENT,
};
