'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CalendarDays, Inbox, Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/capture', key: 'capture', Icon: Sparkles },
  { href: '/inbox', key: 'inbox', Icon: Inbox },
  { href: '/calendar', key: 'calendar', Icon: CalendarDays },
] as const;

/** Primary navigation. Client-side only because it highlights the active route. */
export function MainNav({ className }: { className?: string }) {
  const t = useTranslations('nav');
  const pathname = usePathname();

  return (
    <nav className={cn('flex items-center gap-0.5', className)} aria-label={t('openMenu')}>
      {ITEMS.map(({ href, key, Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors sm:px-3',
              isActive
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {/* The label is redundant with the icon on phones, where space is
                tighter than the benefit of spelling it out. */}
            <span className="hidden sm:inline">{t(key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
