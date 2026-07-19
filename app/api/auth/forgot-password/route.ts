import type { NextRequest } from 'next/server';

import { fail, handleRouteError, ok } from '@/lib/api/responses';
import { forgotPasswordSchema } from '@/lib/auth/schemas';
import { requestPasswordReset } from '@/lib/auth/user-service';
import { ERROR_CODES } from '@/lib/errors';

/**
 * Starts the password reset flow.
 *
 * Always answers 200, whether or not the address is registered — the response
 * must not reveal which emails have accounts.
 */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return fail(ERROR_CODES.VALIDATION, 422);
    }

    await requestPasswordReset(parsed.data.email, request.nextUrl.origin);

    return ok({ sent: true });
  } catch (error) {
    return handleRouteError(error, 'forgot-password');
  }
}
