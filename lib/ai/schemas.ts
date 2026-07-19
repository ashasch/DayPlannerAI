import { z } from 'zod';

import { isValidIsoDate } from '@/lib/date';
import { TASK_PRIORITIES } from '@/lib/tasks/types';

export { TASK_PRIORITIES };
export type { TaskPriority } from '@/lib/tasks/types';

/**
 * A single task extracted from a brain dump.
 *
 * This schema is the contract with the model: its output is parsed through it,
 * so a hallucinated shape becomes a caught validation error rather than a
 * runtime crash deep in the UI.
 */
export const extractedTaskSchema = z.object({
  /** Short imperative phrasing, in the user's own language. */
  title: z.string().trim().min(1).max(200),

  priority: z.enum(TASK_PRIORITIES),

  /** Free-form grouping such as "work" or "home". Model-chosen, may be absent. */
  category: z.string().trim().max(60).nullish(),

  /** Rough effort estimate; null when the model cannot reasonably guess. */
  estimatedMinutes: z
    .number()
    .int()
    .positive()
    .max(60 * 24)
    .nullish(),

  /**
   * Day the task is planned for, resolved from phrases like "завтра" or
   * "в п'ятницю", or `null` when the text implies no particular day.
   *
   * Validated as a real calendar date — models happily emit things like
   * `2026-02-31`, and letting that reach Postgres would fail the insert with an
   * opaque driver error instead of a clean validation message.
   */
  plannedDate: z
    .string()
    .refine(isValidIsoDate, { message: 'plannedDate must be a real YYYY-MM-DD date' })
    .nullish(),
});

export const brainDumpAnalysisSchema = z.object({
  tasks: z.array(extractedTaskSchema).max(50),
});

export type ExtractedTask = z.infer<typeof extractedTaskSchema>;
export type BrainDumpAnalysis = z.infer<typeof brainDumpAnalysisSchema>;
