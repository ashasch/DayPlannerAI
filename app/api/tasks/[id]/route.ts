import type { NextRequest } from 'next/server';

import { auth } from '@/auth';
import { fail, handleRouteError, ok } from '@/lib/api/responses';
import { taskRepository } from '@/lib/db';
import { ERROR_CODES } from '@/lib/errors';
import { updateTaskSchema } from '@/lib/tasks/schemas';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Updates a task — most often just its `plannedDate`, when the user reschedules
 * from the Inbox or the calendar.
 *
 * The repository filters on `userId`, so a task belonging to someone else
 * simply matches no rows and comes back as 404 rather than leaking its
 * existence.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return fail(ERROR_CODES.UNAUTHORIZED, 401);
    }

    const { id } = await context.params;
    const body: unknown = await request.json();
    const parsed = updateTaskSchema.safeParse(body);

    if (!parsed.success) {
      return fail(ERROR_CODES.VALIDATION, 422);
    }

    const task = await taskRepository.update(session.user.id, id, parsed.data);

    if (!task) {
      return fail(ERROR_CODES.NOT_FOUND, 404);
    }

    return ok({ task });
  } catch (error) {
    return handleRouteError(error, 'tasks/update');
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return fail(ERROR_CODES.UNAUTHORIZED, 401);
    }

    const { id } = await context.params;
    const deleted = await taskRepository.delete(session.user.id, id);

    if (!deleted) {
      return fail(ERROR_CODES.NOT_FOUND, 404);
    }

    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error, 'tasks/delete');
  }
}
