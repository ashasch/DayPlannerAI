import 'server-only';

import { DEFAULT_MODEL, getAnthropicClient } from './anthropic';

export interface CaptureAcknowledgement {
  model: string;
  /** A one-line reply from the model, proving the round-trip works. */
  reply: string;
  characters: number;
}

/**
 * Stage 1 placeholder for brain-dump analysis.
 *
 * Deliberately does *not* extract tasks yet — it sends a single cheap message
 * so the whole path (env key → SDK → API → UI) is proven working before Stage 2
 * layers structured task extraction on top of the same client.
 *
 * @param text The raw brain dump typed or dictated by the user.
 * @param locale Language the acknowledgement should be written in.
 * @throws When the API key is missing or the request fails.
 */
export async function acknowledgeBrainDump(
  text: string,
  locale: string,
): Promise<CaptureAcknowledgement> {
  const anthropic = getAnthropicClient();

  if (!anthropic) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 64,
    system:
      'You are the connection check for a day-planning app. Reply with a single short encouraging sentence confirming the notes were received. Do not list, summarise or analyse the notes.',
    messages: [
      {
        role: 'user',
        content: `Reply in this language: ${locale}.\n\nNotes:\n${text.slice(0, 2000)}`,
      },
    ],
  });

  const reply = response.content
    .filter((block): block is Extract<typeof block, { type: 'text' }> => block.type === 'text')
    .map((block) => block.text)
    .join(' ')
    .trim();

  return {
    model: DEFAULT_MODEL,
    reply,
    characters: text.length,
  };
}
