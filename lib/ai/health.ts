import 'server-only';

import { DEFAULT_MODEL, getAiClient } from './client';

export type AiStatus = 'ready' | 'notConfigured' | 'unreachable';

export interface AiHealth {
  status: AiStatus;
  model: string | null;
}

/**
 * Verifies that the Anthropic integration actually works end to end.
 *
 * Sends the smallest possible completion rather than just checking that a key
 * exists — a present-but-invalid key should surface as `unreachable`, not
 * `ready`. This is exactly what caught the Anthropic-key-on-OpenRouter mismatch.
 */
export async function checkAiHealth(): Promise<AiHealth> {
  const client = getAiClient();

  if (!client) {
    return { status: 'notConfigured', model: null };
  }

  try {
    await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 4,
      messages: [{ role: 'user', content: 'ping' }],
    });

    return { status: 'ready', model: DEFAULT_MODEL };
  } catch (error) {
    console.error('[ai] Health check failed:', error);
    return { status: 'unreachable', model: DEFAULT_MODEL };
  }
}
