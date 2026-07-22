import type { NextRequest } from 'next/server';

import { auth } from '@/auth';
import { fail, handleRouteError, ok } from '@/lib/api/responses';
import { generateWeeklySummary } from '@/lib/ai/weekly-summary';
import { getWeeklyDigest } from '@/lib/db/dashboard-repository';
import { findSummary, saveSummary } from '@/lib/db/summary-repository';
import { currentWeekStart } from '@/lib/dashboard/period';
import { summaryRequestSchema } from '@/lib/dashboard/schemas';
import { addDays, fromIsoDate, toIsoDate } from '@/lib/date';
import { isAiConfigured } from '@/lib/env';
import { ERROR_CODES } from '@/lib/errors';
import { resolveLocale } from '@/lib/i18n/locale';

function weekEndOf(weekStart: string): string {
  return toIsoDate(addDays(fromIsoDate(weekStart), 6));
}

/**
 * Returns the cached summary for the current week, if there is one.
 *
 * Never generates: opening the dashboard must not cost an inference call, so
 * a miss is reported as `summary: null` and the UI offers the button.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return fail(ERROR_CODES.UNAUTHORIZED, 401);
    }

    const weekStart = currentWeekStart(request.nextUrl.searchParams.get('today') ?? undefined);
    const cached = await findSummary(session.user.id, weekStart);

    return ok({
      summary: cached ? { ...cached, cached: true } : null,
      weekStart,
      aiConfigured: isAiConfigured,
    });
  } catch (error) {
    return handleRouteError(error, 'dashboard/summary/get');
  }
}

/** Generates (or regenerates) the weekly summary. Always user-initiated. */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return fail(ERROR_CODES.UNAUTHORIZED, 401);
    }

    if (!isAiConfigured) {
      return fail(ERROR_CODES.AI_NOT_CONFIGURED, 503);
    }

    const body: unknown = await request.json().catch(() => ({}));
    const parsed = summaryRequestSchema.safeParse(body);

    if (!parsed.success) {
      return fail(ERROR_CODES.VALIDATION, 422);
    }

    const { regenerate, today } = parsed.data;
    const weekStart = currentWeekStart(today);
    const weekEnd = weekEndOf(weekStart);

    // Without an explicit regenerate, a second press this week costs nothing.
    if (!regenerate) {
      const cached = await findSummary(session.user.id, weekStart);
      if (cached) {
        return ok({ summary: { ...cached, cached: true }, weekStart });
      }
    }

    const digest = await getWeeklyDigest(session.user.id, weekStart, weekEnd);
    const locale = await resolveLocale();

    const generated = await generateWeeklySummary({ digest, weekStart, weekEnd, locale });

    const stored = await saveSummary({
      userId: session.user.id,
      weekStart,
      content: generated.content,
      model: generated.model,
      locale,
    });

    return ok({ summary: { ...stored, cached: false }, weekStart });
  } catch (error) {
    return handleRouteError(error, 'dashboard/summary/post');
  }
}
