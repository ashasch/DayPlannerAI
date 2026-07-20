import { z } from 'zod';

import { isValidIsoDate } from '@/lib/date';

import { TASK_PRIORITIES } from './types';

/** A date, or explicit `null` to unschedule. */
const plannedDate = z
  .string()
  .refine(isValidIsoDate, { message: 'Expected a real YYYY-MM-DD date' })
  .nullable();

const title = z.string().trim().min(1).max(200);
const category = z.string().trim().max(60).nullable();
const estimatedMinutes = z
  .number()
  .int()
  .positive()
  .max(60 * 24)
  .nullable();

export const taskDraftSchema = z.object({
  title,
  priority: z.enum(TASK_PRIORITIES),
  category: category.default(null),
  estimatedMinutes: estimatedMinutes.default(null),
  plannedDate: plannedDate.default(null),
});

/** Body of `POST /api/tasks` — save a reviewed batch of drafts. */
export const createTasksSchema = z.object({
  tasks: z.array(taskDraftSchema).min(1).max(50),
});

/**
 * Body of `PATCH /api/tasks/[id]`.
 *
 * Every field is optional, but at least one must be present — an empty patch
 * almost always means the client sent the wrong shape, and silently returning
 * the unchanged task would hide that.
 */
export const updateTaskSchema = z
  .object({
    title: title.optional(),
    priority: z.enum(TASK_PRIORITIES).optional(),
    category: category.optional(),
    estimatedMinutes: estimatedMinutes.optional(),
    plannedDate: plannedDate.optional(),
    completed: z.boolean().optional(),
  })
  .refine((patch) => Object.keys(patch).length > 0, {
    message: 'Patch must contain at least one field',
  });

/** Query of `GET /api/tasks` — optional calendar window. */
export const listTasksQuerySchema = z.object({
  from: z.string().refine(isValidIsoDate).optional(),
  to: z.string().refine(isValidIsoDate).optional(),
});

export type CreateTasksInput = z.infer<typeof createTasksSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
