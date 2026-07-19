import type { NextRequest } from 'next/server';

import { fail, handleRouteError, ok } from '@/lib/api/responses';
import { resetPasswordSchema } from '@/lib/auth/schemas';
import { resetPassword } from '@/lib/auth/user-service';
import { ERROR_CODES } from '@/lib/errors';

/** Completes the password reset flow using a single-use token. */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return fail(ERROR_CODES.VALIDATION, 422);
    }

    await resetPassword(parsed.data.token, parsed.data.password);

    return ok({ reset: true });
  } catch (error) {
    return handleRouteError(error, 'reset-password');
  }
}
