'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';

/** Error boundary scoped to the signed-in shell, so the header survives. */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common');

  useEffect(() => {
    console.error('[app] Route error:', error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 px-4 py-24 text-center sm:px-6">
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
