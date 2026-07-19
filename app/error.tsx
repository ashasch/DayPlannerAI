'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';

/** Route-level error boundary for the whole app. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common');

  useEffect(() => {
    console.error('[app] Unhandled error:', error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t('somethingWentWrong')}</h1>
        <p className="max-w-sm text-balance text-sm text-muted-foreground">
          {t('unexpectedError')}
        </p>
      </div>

      <Button onClick={reset} variant="outline">
        <RotateCcw className="size-4" aria-hidden />
        {t('retry')}
      </Button>
    </div>
  );
}
