import Link from 'next/link';

import { BrandMark } from '@/components/layout/brand-mark';
import { UserMenu } from '@/features/auth/components/user-menu';
import { LanguageSwitcher } from '@/features/i18n/components/language-switcher';
import { DEFAULT_SIGNED_IN_REDIRECT } from '@/lib/auth/routes';

interface AppHeaderProps {
  user: { name: string; email: string };
}

/**
 * Header for the signed-in shell.
 *
 * A Server Component: only the two interactive islands (language switcher,
 * user menu) ship JavaScript to the browser.
 */
export function AppHeader({ user }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href={DEFAULT_SIGNED_IN_REDIRECT}
          className="rounded-lg transition-opacity hover:opacity-80"
        >
          <BrandMark />
        </Link>

        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <UserMenu name={user.name} email={user.email} />
        </div>
      </div>
    </header>
  );
}
