'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Globe, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LOCALES, type Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

import { setLocaleAction } from '../actions';

/**
 * UA/EN switcher.
 *
 * Swaps the language in place: the server action stores the choice, then
 * `router.refresh()` re-renders the server tree with the new messages. No
 * navigation, no reload, no lost form state.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations('language');
  const activeLocale = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSelect(locale: Locale) {
    if (locale === activeLocale || isPending) return;

    startTransition(async () => {
      const result = await setLocaleAction(locale);

      if (!result.ok) {
        toast.error(t('changeFailed'));
        return;
      }

      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('gap-2 text-muted-foreground hover:text-foreground', className)}
          aria-label={t('label')}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Globe className="size-4" aria-hidden />
          )}
          <span className="text-xs font-medium uppercase tracking-wide">{activeLocale}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[11rem]">
        <DropdownMenuLabel>{t('label')}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {LOCALES.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onSelect={() => handleSelect(locale)}
            className="justify-between"
          >
            <span>{t(locale)}</span>
            {locale === activeLocale ? <Check className="size-4" aria-hidden /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
