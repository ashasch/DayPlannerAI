import 'server-only';

import { fromIsoDate, isValidIsoDate, toIsoDate, todayIso } from '@/lib/date';
import type { TaskDraft } from '@/lib/tasks/types';

import { DEFAULT_MODEL, getAiClient } from './client';
import { brainDumpAnalysisSchema } from './schemas';

export interface CaptureAnalysis {
  tasks: TaskDraft[];
  model: string;
}

/** Maximum characters of the dump we forward, to bound cost and latency. */
const MAX_INPUT_CHARS = 8000;

/** How many days of the calendar to spell out for the model. */
const DATE_REFERENCE_DAYS = 21;

/**
 * Builds an explicit date → weekday table.
 *
 * Giving the model the anchor date alone is not enough: asked for "п'ятниця" it
 * reliably names the right weekday but computes the wrong date, because date
 * arithmetic is exactly the kind of multi-step counting LLMs get wrong. Listing
 * the upcoming dates turns that arithmetic into a lookup.
 */
function buildDateReference(anchor: string): string {
  const start = fromIsoDate(anchor);

  return Array.from({ length: DATE_REFERENCE_DAYS }, (_, offset) => {
    const day = new Date(start);
    day.setDate(day.getDate() + offset);

    const iso = toIsoDate(day);
    const weekday = day.toLocaleDateString('en-US', { weekday: 'long' });
    const suffix = offset === 0 ? '  <- today' : offset === 1 ? '  <- tomorrow' : '';

    return `${iso} = ${weekday}${suffix}`;
  }).join('\n');
}

/**
 * Builds the system prompt.
 *
 * "Today" is injected rather than left to the model: an LLM has no clock, so
 * without an explicit anchor every relative phrase ("завтра", "next Friday")
 * resolves against its training cutoff and silently lands on the wrong year.
 */
function buildSystemPrompt(today: string, weekday: string): string {
  return `You turn a messy brain dump into a structured task list.

Today is ${today} (${weekday}). Resolve every relative date against that.

Date reference — copy dates from this table, never calculate them yourself:
${buildDateReference(today)}

Rules:
- Split the text into individual, actionable tasks. One task per distinct thing to do.
- Merge obvious duplicates. Ignore pure commentary that is not a task.
- Write each title in the SAME language as the input, phrased imperatively and concisely.
- priority: "high" for anything with a deadline, dependency on others, or explicit urgency;
  "low" for vague someday items; "medium" otherwise.
- category: a short lowercase grouping (e.g. "work", "home", "health"), or null.
- estimatedMinutes: a realistic integer estimate, or null if genuinely unguessable.
- plannedDate: "YYYY-MM-DD" when the text points at a specific day, otherwise null.
  * "сьогодні"/"today" -> today's date.
  * "завтра"/"tomorrow" -> today + 1 day.
  * A weekday ("в п'ятницю", "on Friday") -> look up the NEXT row in the table
    with that weekday. Do not count days by hand.
  * A bare day number ("20 числа", "on the 20th") -> that day in the current month,
    or the next month if it has already passed.
  * An explicit date -> exactly that date.
  * A deadline ("до п'ятниці", "by Friday") -> the deadline day itself.
  * Vague timing ("колись", "someday", "цього тижня") -> null. Do NOT guess.
- Never invent a date that the text does not support. null is always the safe answer.

Respond with ONLY a JSON object of the form:
{"tasks":[{"title":"…","priority":"high|medium|low","category":"…"|null,"estimatedMinutes":30|null,"plannedDate":"2026-07-25"|null}]}
No markdown fences, no commentary, no trailing text.`;
}

/**
 * Extracts structured tasks from a raw brain dump.
 *
 * @param text The raw brain dump typed or dictated by the user.
 * @param locale Language hint, so titles come back in the user's language.
 * @param today The user's local date as `YYYY-MM-DD`; the anchor for relative
 * dates. Supplied by the client because the server's timezone is not the
 * user's — on Vercel it is UTC, which is already the wrong day for much of the
 * world by late evening.
 * @throws When the API key is missing, the request fails, or the reply is not
 * valid JSON matching the schema.
 */
export async function analyzeBrainDump(
  text: string,
  locale: string,
  today: string,
): Promise<CaptureAnalysis> {
  const client = getAiClient();

  if (!client) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const anchor = isValidIsoDate(today) ? today : todayIso();
  const weekday = fromIsoDate(anchor).toLocaleDateString('en-US', { weekday: 'long' });

  const response = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 2048,
    // Extraction is a precision task, not a creative one. The API defaults to
    // 1.0, which was enough to make the same "до п'ятниці" resolve to Friday on
    // one run and Saturday on the next.
    temperature: 0,
    system: buildSystemPrompt(anchor, weekday),
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

  return {
    // Normalise `undefined` to `null` so the shape matches TaskDraft exactly.
    tasks: analysis.tasks.map((task) => ({
      title: task.title,
      priority: task.priority,
      category: task.category ?? null,
      estimatedMinutes: task.estimatedMinutes ?? null,
      plannedDate: task.plannedDate ?? null,
    })),
    model: DEFAULT_MODEL,
  };
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
