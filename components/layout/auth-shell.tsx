import Link from 'next/link';
import type { ReactNode } from 'react';

import { BrandMark } from '@/components/layout/brand-mark';
import { LanguageSwitcher } from '@/features/i18n/components/language-switcher';
import { ThemeToggle } from '@/features/theme/components/theme-toggle';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Rendered under the card — usually the "no account? register" link. */
  footer?: ReactNode;
}

/** Centred, mobile-first frame shared by every authentication screen. */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="bg-aurora relative flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="rounded-lg transition-opacity hover:opacity-80">
          <BrandMark />
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16 pt-4 sm:px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 space-y-2 text-center">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
            <p className="text-balance text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {children}

          {footer ? (
            <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
