'use client';

import { useTranslations } from 'next-intl';
import { Check, Moon, Sun } from 'lucide-react';

import { Modal } from '@/components/ui/modal';
import { useAppearance } from '@/features/theme/appearance-provider';
import { ACCENT_SWATCHES, ACCENTS, THEMES, type Theme } from '@/lib/theme/config';
import { cn } from '@/lib/utils';

const THEME_ICONS: Record<Theme, typeof Sun> = { light: Sun, dark: Moon };

/** Appearance settings: light/dark and the accent colour. */
export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations('appearance');
  const { theme, accent, setTheme, setAccent } = useAppearance();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('title')}
      description={t('subtitle')}
      closeLabel={t('close')}
    >
      <div className="space-y-6">
        <section>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('themeLabel')}
          </h3>

          <div role="radiogroup" aria-label={t('themeLabel')} className="grid grid-cols-2 gap-2">
            {THEMES.map((value) => {
              const Icon = THEME_ICONS[value];
              const isActive = theme === value;

              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => setTheme(value)}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors',
                    isActive
                      ? 'border-primary bg-primary-muted text-foreground'
                      : 'border-border text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {t(`theme.${value}`)}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('accentLabel')}
          </h3>

          <div role="radiogroup" aria-label={t('accentLabel')} className="flex flex-wrap gap-2">
            {ACCENTS.map((value) => {
              const isActive = accent === value;

              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  aria-label={t(`accent.${value}`)}
                  title={t(`accent.${value}`)}
                  onClick={() => setAccent(value)}
                  className={cn(
                    'flex size-9 items-center justify-center rounded-full border-2 transition-all',
                    isActive ? 'scale-105 border-foreground' : 'border-transparent hover:scale-105',
                  )}
                >
                  <span
                    className="flex size-7 items-center justify-center rounded-full"
                    // The only inline colour in the app: a swatch must show what
                    // an accent looks like *before* it is applied, so it cannot
                    // read --primary (which still holds the current one).
                    style={{ backgroundColor: ACCENT_SWATCHES[value] }}
                  >
                    {isActive ? (
                      <Check className="size-4 text-background" strokeWidth={3} aria-hidden />
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </Modal>
  );
}
