import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';

export default async function NotFound() {
  const t = await getTranslations('common');

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="text-3xl font-semibold tracking-tight">{t('notFoundTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('notFoundDescription')}</p>
      </div>

      <Button asChild variant="outline">
        <Link href="/">{t('goHome')}</Link>
      </Button>
    </div>
  );
}
