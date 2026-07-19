import { NextResponse } from 'next/server';

import { ERROR_CODES, toApiError, type ErrorCode } from '@/lib/errors';

/** Success envelope. */
export function ok<T extends object>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/** Error envelope carrying a translatable code rather than a message. */
export function fail(code: ErrorCode, status = 400): NextResponse {
  return NextResponse.json({ error: code }, { status });
}

/**
 * Converts a thrown value into a response, logging anything unexpected.
 *
 * Known `AppError`s map to their own status/code; everything else becomes a
 * generic 500 so internal details never reach the client.
 */
export function handleRouteError(error: unknown, context: string): NextResponse {
  const { code, status } = toApiError(error);

  if (code === ERROR_CODES.UNKNOWN) {
    console.error(`[api] ${context}:`, error);
  }

  return fail(code, status);
}
