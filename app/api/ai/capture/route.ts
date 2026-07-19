import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { fail, handleRouteError, ok } from '@/lib/api/responses';
import { analyzeBrainDump } from '@/lib/ai/capture';
import { isValidIsoDate } from '@/lib/date';
import { ERROR_CODES } from '@/lib/errors';
import { isAiConfigured } from '@/lib/env';
import { LOCALES } from '@/lib/i18n/config';

const captureSchema = z.object({
  text: z.string().trim().min(1).max(10_000),
  locale: z.enum(LOCALES),
  /** The client's local date — the anchor for resolving "tomorrow" etc. */
  today: z.string().refine(isValidIsoDate).optional(),
});

/**
 * Analyses a brain dump into structured task drafts.
 *
 * Deliberately does not persist anything: the user reviews the drafts and
 * saves them explicitly via `POST /api/tasks`.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return fail(ERROR_CODES.UNAUTHORIZED, 401);
    }

    // Distinguish "nobody configured a key" from "the API call failed", so the
    // UI can tell the user which one it is.
    if (!isAiConfigured) {
      return fail(ERROR_CODES.AI_NOT_CONFIGURED, 503);
    }

    const body: unknown = await request.json();
    const parsed = captureSchema.safeParse(body);

    if (!parsed.success) {
      return fail(ERROR_CODES.VALIDATION, 422);
    }

    const result = await analyzeBrainDump(
      parsed.data.text,
      parsed.data.locale,
      parsed.data.today ?? '',
    );

    return ok(result);
  } catch (error) {
    return handleRouteError(error, 'ai/capture');
  }
}
