import 'server-only';

import Anthropic from '@anthropic-ai/sdk';

import { env } from '@/lib/env';

/**
 * Anthropic client factory.
 *
 * The key is read exclusively from `ANTHROPIC_API_KEY` and never crosses the
 * server boundary: this module imports `server-only`, so importing it from a
 * Client Component is a build error rather than a leak.
 */

let client: Anthropic | null = null;

/** Returns a memoised client, or `null` when no API key is configured. */
export function getAnthropicClient(): Anthropic | null {
  if (!env.ANTHROPIC_API_KEY) return null;

  client ??= new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    maxRetries: 2,
    timeout: 30_000,
  });

  return client;
}

/** The model used for every request unless a call site overrides it. */
export const DEFAULT_MODEL = env.ANTHROPIC_MODEL;
