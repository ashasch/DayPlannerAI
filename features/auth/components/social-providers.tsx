'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

/**
 * Placeholder row for third-party sign-in.
 *
 * The buttons are deliberately inert in Stage 1. Wiring one up means adding the
 * provider to `auth.ts` and replacing the click handler with
 * `signIn('<provider>')` — the layout, session shape and routing already
 * accommodate it.
 */
const PROVIDERS = [
  { id: 'google', label: 'Google' },
  { id: 'apple', label: 'Apple' },
  { id: 'github', label: 'GitHub' },
] as const;

export function SocialProviders() {
  const t = useTranslations('auth');

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">{t('orContinueWith')}</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {PROVIDERS.map((provider) => (
          <Button
            key={provider.id}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => toast.info(t('providerComingSoon', { provider: provider.label }))}
          >
            {provider.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
