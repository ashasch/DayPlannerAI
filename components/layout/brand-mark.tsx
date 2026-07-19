import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

/** Wordmark used in the header and on the auth screens. */
export function BrandMark({ className }: { className?: string }) {
  const t = useTranslations('common');

  return (
    <span className={cn('flex items-center gap-2', className)}>
      <span className="flex size-7 items-center justify-center rounded-lg bg-foreground text-background">
        <Sparkles className="size-4" aria-hidden />
      </span>
      <span className="text-sm font-semibold tracking-tight">{t('appName')}</span>
    </span>
  );
}
