'use client';

import { Toaster as SonnerToaster } from 'sonner';

import { useAppearance } from '@/features/theme/appearance-provider';

/**
 * Global toast host.
 *
 * Styled through the app's design tokens, and told the active theme so Sonner's
 * own base styles do not fight them when the user switches to light.
 */
export function Toaster() {
  const { theme } = useAppearance();

  return (
    <SonnerToaster
      theme={theme}
      position="top-center"
      richColors={false}
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'group rounded-xl border border-border bg-popover text-popover-foreground shadow-lg',
          description: 'text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-secondary text-secondary-foreground',
          error: 'border-destructive/40',
        },
      }}
    />
  );
}
