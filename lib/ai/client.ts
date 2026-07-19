import 'server-only';

import Anthropic from '@anthropic-ai/sdk';

import { env } from '@/lib/env';

/**
 * AI client (OpenRouter).
 *
 * The provider is OpenRouter, not Anthropic directly — hence the
 * `OPENROUTER_API_KEY` name. We still use `@anthropic-ai/sdk` because
 * OpenRouter exposes an Anthropic-compatible `/v1/messages` endpoint that
 * returns native Anthropic response shapes, so pointing the SDK at OpenRouter's
 * base URL keeps the typed request/response model with no translation layer.
 *
 * Note that model IDs must be OpenRouter-namespaced (`anthropic/claude-…`);
 * a bare `claude-…` id is rejected.
 *
 * The key never crosses the server boundary: this module imports `server-only`,
 * so importing it from a Client Component is a build error rather than a leak.
 */

/**
 * Note the missing `/v1`: the Anthropic SDK appends `/v1/messages` itself, so
 * including it here would produce `/api/v1/v1/messages` and a 404.
 */
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api';

let client: Anthropic | null = null;

/** Returns a memoised client, or `null` when no API key is configured. */
export function getAiClient(): Anthropic | null {
  if (!env.OPENROUTER_API_KEY) return null;

  client ??= new Anthropic({
    apiKey: env.OPENROUTER_API_KEY,
    baseURL: OPENROUTER_BASE_URL,
    maxRetries: 2,
    timeout: 60_000,
  });

  return client;
}

/** The model used for every request unless a call site overrides it. */
export const DEFAULT_MODEL = env.OPENROUTER_MODEL;
