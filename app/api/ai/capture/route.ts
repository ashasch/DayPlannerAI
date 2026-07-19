import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { fail, handleRouteError, ok } from '@/lib/api/responses';
import { analyzeBrainDump } from '@/lib/ai/capture';
import { ERROR_CODES } from '@/lib/errors';
import { isAiConfigured } from '@/lib/env';
import { LOCALES } from '@/lib/i18n/config';

const captureSchema = z.object({
  text: z.string().trim().min(1).max(10_000),
  locale: z.enum(LOCALES),
});

/**
 * Turns a brain dump into a structured task list.
 *
 * Tasks are returned but not yet persisted — storing and scheduling them is
 * Stage 2 work.
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

    const result = await analyzeBrainDump(parsed.data.text, parsed.data.locale);

    return ok(result);
  } catch (error) {
    return handleRouteError(error, 'ai/capture');
  }
}
