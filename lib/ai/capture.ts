import 'server-only';

import { DEFAULT_MODEL, getAiClient } from './client';
import { brainDumpAnalysisSchema, type BrainDumpAnalysis } from './schemas';

export interface CaptureAnalysis extends BrainDumpAnalysis {
  model: string;
}

/** Maximum characters of the dump we forward, to bound cost and latency. */
const MAX_INPUT_CHARS = 8000;

const SYSTEM_PROMPT = `You turn a messy brain dump into a structured task list.

Rules:
- Split the text into individual, actionable tasks. One task per distinct thing to do.
- Merge obvious duplicates. Ignore pure commentary that is not a task.
- Write each title in the SAME language as the input, phrased imperatively and concisely.
- priority: "high" for anything with a deadline, dependency on others, or explicit urgency;
  "low" for vague someday items; "medium" otherwise.
- category: a short lowercase grouping (e.g. "work", "home", "health"), or null.
- estimatedMinutes: a realistic integer estimate, or null if genuinely unguessable.

Respond with ONLY a JSON object of the form:
{"tasks":[{"title":"…","priority":"high|medium|low","category":"…"|null,"estimatedMinutes":30|null}]}
No markdown fences, no commentary, no trailing text.`;

/**
 * Extracts structured tasks from a raw brain dump.
 *
 * The model is asked for bare JSON and the reply is validated against
 * `brainDumpAnalysisSchema`, so malformed or hallucinated output surfaces as a
 * thrown error here rather than as broken data reaching the UI.
 *
 * @param text The raw brain dump typed or dictated by the user.
 * @param locale Language hint, so titles come back in the user's language.
 * @throws When the API key is missing, the request fails, or the reply is not
 * valid JSON matching the schema.
 */
export async function analyzeBrainDump(text: string, locale: string): Promise<CaptureAnalysis> {
  const client = getAiClient();

  if (!client) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const response = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Input language: ${locale}.\n\nBrain dump:\n${text.slice(0, MAX_INPUT_CHARS)}`,
      },
      // Prefilling the opening brace stops the model from wrapping the JSON in
      // prose or code fences, which is the usual cause of parse failures.
      { role: 'assistant', content: '{' },
    ],
  });

  const raw =
    '{' +
    response.content
      .filter((block): block is Extract<typeof block, { type: 'text' }> => block.type === 'text')
      .map((block) => block.text)
      .join('');

  const analysis = brainDumpAnalysisSchema.parse(parseJson(raw));

  return { ...analysis, model: DEFAULT_MODEL };
}

/**
 * Parses the model's reply, tolerating a trailing code fence or stray prose
 * after the JSON object by falling back to the outermost braces.
 */
function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');

    if (start === -1 || end <= start) {
      throw new Error('Model reply contained no JSON object');
    }

    return JSON.parse(raw.slice(start, end + 1));
  }
}
