import Link from 'next/link';

import { BrandMark } from '@/components/layout/brand-mark';
import { MainNav } from '@/components/layout/main-nav';
import { UserMenu } from '@/features/auth/components/user-menu';
import { LanguageSwitcher } from '@/features/i18n/components/language-switcher';
import { ThemeToggle } from '@/features/theme/components/theme-toggle';
import { DEFAULT_SIGNED_IN_REDIRECT } from '@/lib/auth/routes';

interface AppHeaderProps {
  user: { name: string; email: string };
}

/**
 * Header for the signed-in shell.
 *
 * A Server Component: only the interactive islands (nav highlighting, language
 * switcher, user menu) ship JavaScript to the browser.
 */
export function AppHeader({ user }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-6">
          <Link
            href={DEFAULT_SIGNED_IN_REDIRECT}
            className="hidden shrink-0 rounded-lg transition-opacity hover:opacity-80 sm:block"
          >
            <BrandMark />
          </Link>

          <MainNav />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />
          <LanguageSwitcher />
          <UserMenu name={user.name} email={user.email} />
        </div>
      </div>
    </header>
  );
}
