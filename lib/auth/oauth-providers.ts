import 'server-only';

import { isGitHubOAuthConfigured, isGoogleOAuthConfigured } from '@/lib/env';

/** OAuth providers the UI knows how to render. */
export const OAUTH_PROVIDERS = [
  { id: 'github', label: 'GitHub' },
  { id: 'google', label: 'Google' },
] as const;

export type OAuthProviderId = (typeof OAUTH_PROVIDERS)[number]['id'];

export interface OAuthProviderStatus {
  id: OAuthProviderId;
  label: string;
  /** Whether both halves of the credential pair are present on this deploy. */
  enabled: boolean;
}

/**
 * Reports which providers are actually usable right now.
 *
 * Passed from the (server-rendered) auth pages into the client button row, so
 * the UI can only ever offer a provider that will really complete the flow —
 * rather than starting a redirect that dead-ends at the callback.
 */
export function getOAuthProviderStatuses(): OAuthProviderStatus[] {
  const enabledById: Record<OAuthProviderId, boolean> = {
    github: isGitHubOAuthConfigured,
    google: isGoogleOAuthConfigured,
  };

  return OAUTH_PROVIDERS.map((provider) => ({
    id: provider.id,
    label: provider.label,
    enabled: enabledById[provider.id],
  }));
}
