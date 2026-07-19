import type { NextRequest } from 'next/server';

import { fail, handleRouteError, ok } from '@/lib/api/responses';
import { registerSchema } from '@/lib/auth/schemas';
import { registerUser } from '@/lib/auth/user-service';
import { ERROR_CODES } from '@/lib/errors';

/** Creates an email/password account. */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return fail(ERROR_CODES.VALIDATION, 422);
    }

    const user = await registerUser({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
    });

    return ok({ user }, 201);
  } catch (error) {
    return handleRouteError(error, 'register');
  }
}
