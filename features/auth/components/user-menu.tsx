'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { signOut } from 'next-auth/react';
import { Loader2, LogOut, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AUTH_ROUTES } from '@/lib/auth/routes';

interface UserMenuProps {
  name: string;
  email: string;
}

/** Avatar-initial trigger with the account details and a sign-out action. */
export function UserMenu({ name, email }: UserMenuProps) {
  const t = useTranslations('auth');
  const tNav = useTranslations('nav');
  const [isPending, startTransition] = useTransition();

  const initial = (name.trim()[0] ?? email[0] ?? '?').toUpperCase();

  function handleSignOut() {
    startTransition(async () => {
      await signOut({ redirectTo: AUTH_ROUTES.login });
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full border border-border bg-secondary text-sm font-medium"
          aria-label={tNav('account')}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <span aria-hidden>{initial}</span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[14rem]">
        <DropdownMenuLabel className="flex items-center gap-2 py-2 text-foreground">
          <User className="size-4 text-muted-foreground" aria-hidden />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{name}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">{email}</span>
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={handleSignOut} disabled={isPending}>
          <LogOut className="size-4" aria-hidden />
          <span>{t('signOut')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
