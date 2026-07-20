/**
 * Appearance settings.
 *
 * Edge-safe and client-safe: this is imported by the no-flash inline script,
 * the provider and the settings UI, so it must stay free of Node APIs.
 */

export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

export const ACCENTS = ['violet', 'blue', 'green', 'orange', 'pink'] as const;
export type Accent = (typeof ACCENTS)[number];

export const DEFAULT_THEME: Theme = 'dark';
export const DEFAULT_ACCENT: Accent = 'violet';

/** Single localStorage key — one read, one write, no partial states. */
export const APPEARANCE_STORAGE_KEY = 'dayplanner.appearance';

export interface Appearance {
  theme: Theme;
  accent: Accent;
}

export const DEFAULT_APPEARANCE: Appearance = {
  theme: DEFAULT_THEME,
  accent: DEFAULT_ACCENT,
};

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}

export function isAccent(value: unknown): value is Accent {
  return typeof value === 'string' && (ACCENTS as readonly string[]).includes(value);
}

/**
 * Browser chrome colour per theme (the `theme-color` meta tag).
 *
 * Mirrors `--background`. Kept here rather than inline in the layout so no
 * component carries a literal colour.
 */
export const THEME_BROWSER_COLORS: Record<Theme, string> = {
  light: '#ffffff',
  dark: '#111113',
};

/**
 * Swatch colours for the settings UI.
 *
 * These are literal values on purpose: the swatch has to show what each accent
 * looks like *before* it is applied, so it cannot read `--primary` (which still
 * holds the current accent). They mirror the dark-theme values in `globals.css`
 * — the light ones are darkened for text contrast and read muddy as swatches.
 */
export const ACCENT_SWATCHES: Record<Accent, string> = {
  violet: 'hsl(263 75% 68%)',
  blue: 'hsl(213 88% 66%)',
  green: 'hsl(152 55% 55%)',
  orange: 'hsl(27 90% 60%)',
  pink: 'hsl(335 80% 68%)',
};
