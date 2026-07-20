'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import {
  APPEARANCE_STORAGE_KEY,
  DEFAULT_APPEARANCE,
  isAccent,
  isTheme,
  THEME_BROWSER_COLORS,
  type Accent,
  type Appearance,
  type Theme,
} from '@/lib/theme/config';

interface AppearanceContextValue extends Appearance {
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setAccent: (accent: Accent) => void;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

/** Reads the stored appearance, falling back to defaults on anything unexpected. */
function readStoredAppearance(): Appearance {
  try {
    const raw = localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (!raw) return DEFAULT_APPEARANCE;

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_APPEARANCE;

    const { theme, accent } = parsed as Partial<Appearance>;

    return {
      theme: isTheme(theme) ? theme : DEFAULT_APPEARANCE.theme,
      accent: isAccent(accent) ? accent : DEFAULT_APPEARANCE.accent,
    };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

function applyToDocument(appearance: Appearance) {
  const root = document.documentElement;
  root.classList.toggle('dark', appearance.theme === 'dark');
  root.setAttribute('data-accent', appearance.accent);

  // Keep the mobile browser chrome in step; the theme is class-based, so the
  // meta tag cannot follow it through CSS alone.
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', THEME_BROWSER_COLORS[appearance.theme]);
}

/**
 * Holds the current theme and accent.
 *
 * State is initialised to the defaults so the first client render matches the
 * server exactly; the real value is read in an effect. `AppearanceScript` has
 * already put the correct values on `<html>` by then, so there is nothing to
 * see — this state only drives which control looks selected.
 */
export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [appearance, setAppearance] = useState<Appearance>(DEFAULT_APPEARANCE);

  useEffect(() => {
    setAppearance(readStoredAppearance());
  }, []);

  const update = useCallback((partial: Partial<Appearance>) => {
    setAppearance((current) => {
      const next = { ...current, ...partial };

      applyToDocument(next);

      try {
        localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Private mode or a full quota: the choice still applies this session.
      }

      return next;
    });
  }, []);

  const setTheme = useCallback((theme: Theme) => update({ theme }), [update]);
  const setAccent = useCallback((accent: Accent) => update({ accent }), [update]);

  const toggleTheme = useCallback(
    () => update({ theme: appearance.theme === 'dark' ? 'light' : 'dark' }),
    [update, appearance.theme],
  );

  return (
    <AppearanceContext.Provider value={{ ...appearance, setTheme, toggleTheme, setAccent }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance(): AppearanceContextValue {
  const context = useContext(AppearanceContext);

  if (!context) {
    throw new Error('useAppearance must be used inside <AppearanceProvider>');
  }

  return context;
}
