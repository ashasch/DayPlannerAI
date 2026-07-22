import 'server-only';

import type { CategoryStat, DashboardTotals, WeekdayStat } from '@/lib/dashboard/types';

import { DEFAULT_MODEL, getAiClient } from './client';

const WEEKDAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

const SYSTEM_PROMPT = `You write a short weekly reflection for someone using a day planner.

Rules:
- 2–4 sentences. Friendly and concrete, never a pep talk.
- Ground every claim in the numbers you are given. Never invent a number.
- Worth mentioning when true: which category dominated, days that look
  overloaded, categories that got no attention at all, how completion went.
- Address the reader directly and informally ("ти").
- Plain prose only: no lists, no headings, no markdown, no emoji.
- Reply in the requested language and with nothing but the reflection itself.`;

export interface WeeklyDigest {
  totals: DashboardTotals;
  byCategory: CategoryStat[];
  byWeekday: WeekdayStat[];
}

/**
 * Renders the aggregates as compact text for the prompt.
 *
 * Only counts and sums leave the server — never task titles. The model gets
 * enough to reason about the shape of the week without the contents of anyone's
 * to-do list going into an inference request.
 */
function formatDigest(digest: WeeklyDigest, weekStart: string, weekEnd: string): string {
  const { totals, byCategory, byWeekday } = digest;

  const categories = byCategory.length
    ? byCategory
        .map(
          (row) =>
            `- ${row.category ?? 'uncategorised'}: ${row.taskCount} tasks, ${row.totalMinutes} min`,
        )
        .join('\n')
    : '- (no tasks)';

  const weekdays = byWeekday
    .map(
      (row) => `- ${WEEKDAY_NAMES[row.weekday]}: ${row.taskCount} tasks, ${row.totalMinutes} min`,
    )
    .join('\n');

  return `Week: ${weekStart} to ${weekEnd}

Totals:
- tasks: ${totals.taskCount}
- completed: ${totals.completedCount} (${totals.completionRate}%)
- estimated time: ${totals.totalMinutes} min

By category:
${categories}

By weekday (planned):
${weekdays}`;
}

export interface GeneratedSummary {
  content: string;
  model: string;
}

/**
 * Generates the weekly reflection.
 *
 * @throws When no API key is configured or the request fails.
 */
export async function generateWeeklySummary(input: {
  digest: WeeklyDigest;
  weekStart: string;
  weekEnd: string;
  locale: string;
}): Promise<GeneratedSummary> {
  const client = getAiClient();

  if (!client) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const languageName = input.locale === 'uk' ? 'Ukrainian' : 'English';

  const response = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 400,
    // Summarising fixed numbers is not a creative task, and a stable answer
    // for the same week is what makes the cache meaningful.
    temperature: 0.3,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Write the reflection in ${languageName}.\n\n${formatDigest(
          input.digest,
          input.weekStart,
          input.weekEnd,
        )}`,
      },
    ],
  });

  const content = response.content
    .filter((block): block is Extract<typeof block, { type: 'text' }> => block.type === 'text')
    .map((block) => block.text)
    .join(' ')
    .trim();

  if (!content) {
    throw new Error('Model returned an empty summary');
  }

  return { content, model: DEFAULT_MODEL };
}
