'use client';

import { Toaster as SonnerToaster } from 'sonner';

/**
 * Global toast host.
 *
 * Styled through the app's design tokens so toasts match the dark shell rather
 * than shipping Sonner's default light theme.
 */
export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
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
