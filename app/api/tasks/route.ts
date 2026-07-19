import type { NextRequest } from 'next/server';

import { auth } from '@/auth';
import { fail, handleRouteError, ok } from '@/lib/api/responses';
import { taskRepository } from '@/lib/db';
import { ERROR_CODES } from '@/lib/errors';
import { createTasksSchema, listTasksQuerySchema } from '@/lib/tasks/schemas';

/**
 * Lists the signed-in user's tasks.
 *
 * With `from`/`to` it returns only scheduled tasks inside that window (the
 * calendar); without them it returns everything (the Inbox).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return fail(ERROR_CODES.UNAUTHORIZED, 401);
    }

    const parsed = listTasksQuerySchema.safeParse({
      from: request.nextUrl.searchParams.get('from') ?? undefined,
      to: request.nextUrl.searchParams.get('to') ?? undefined,
    });

    if (!parsed.success) {
      return fail(ERROR_CODES.VALIDATION, 422);
    }

    const { from, to } = parsed.data;

    const tasks =
      from && to
        ? await taskRepository.listByUserInRange(session.user.id, from, to)
        : await taskRepository.listByUser(session.user.id);

    return ok({ tasks });
  } catch (error) {
    return handleRouteError(error, 'tasks/list');
  }
}

/** Saves a reviewed batch of AI-proposed drafts. */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return fail(ERROR_CODES.UNAUTHORIZED, 401);
    }

    const body: unknown = await request.json();
    const parsed = createTasksSchema.safeParse(body);

    if (!parsed.success) {
      return fail(ERROR_CODES.VALIDATION, 422);
    }

    const tasks = await taskRepository.createMany(session.user.id, parsed.data.tasks);

    return ok({ tasks }, 201);
  } catch (error) {
    return handleRouteError(error, 'tasks/create');
  }
}
