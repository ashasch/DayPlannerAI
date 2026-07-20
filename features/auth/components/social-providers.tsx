'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DEFAULT_SIGNED_IN_REDIRECT } from '@/lib/auth/routes';
import type { OAuthProviderStatus } from '@/lib/auth/oauth-providers';

interface SocialProvidersProps {
  /** Resolved server-side, so a button is only live if it can complete. */
  providers: OAuthProviderStatus[];
  /** Where to land after a successful sign-in. */
  callbackUrl?: string;
}

/**
 * Third-party sign-in buttons.
 *
 * `signIn` performs a full-page redirect to the provider, so there is no
 * success path to handle here — the browser leaves. The pending state exists
 * only to stop a second click during the hand-off.
 */
export function SocialProviders({ providers, callbackUrl }: SocialProvidersProps) {
  const t = useTranslations('auth');
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (providers.length === 0) return null;

  async function handleSignIn(provider: OAuthProviderStatus) {
    if (!provider.enabled) {
      toast.info(t('providerComingSoon', { provider: provider.label }));
      return;
    }

    setPendingId(provider.id);

    try {
      await signIn(provider.id, { redirectTo: callbackUrl ?? DEFAULT_SIGNED_IN_REDIRECT });
    } catch {
      // Only reached if the redirect itself fails to start.
      setPendingId(null);
      toast.error(t('errors.oauthFailed', { provider: provider.label }));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">{t('orContinueWith')}</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {providers.map((provider) => (
          <Button
            key={provider.id}
            type="button"
            variant="outline"
            size="sm"
            disabled={pendingId !== null}
            onClick={() => handleSignIn(provider)}
          >
            {pendingId === provider.id ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            {provider.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
