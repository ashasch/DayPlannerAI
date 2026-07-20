'use client';

import { useTranslations } from 'next-intl';
import { Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAppearance } from '@/features/theme/appearance-provider';
import { cn } from '@/lib/utils';

/**
 * Light/dark switch.
 *
 * Both icons are always rendered and cross-faded, so the button never changes
 * size mid-swap and the header does not shift.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations('appearance');
  const { theme, toggleTheme } = useAppearance();

  const label = theme === 'dark' ? t('switchToLight') : t('switchToDark');

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={cn('relative text-muted-foreground hover:text-foreground', className)}
    >
      <Sun
        className={cn(
          'absolute size-4 transition-all duration-200',
          theme === 'dark' ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100',
        )}
        aria-hidden
      />
      <Moon
        className={cn(
          'absolute size-4 transition-all duration-200',
          theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0',
        )}
        aria-hidden
      />
    </Button>
  );
}
