import { z } from 'zod';

/** Priority buckets the planner sorts by. */
export const TASK_PRIORITIES = ['high', 'medium', 'low'] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

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
});

export const brainDumpAnalysisSchema = z.object({
  tasks: z.array(extractedTaskSchema).max(50),
});

export type ExtractedTask = z.infer<typeof extractedTaskSchema>;
export type BrainDumpAnalysis = z.infer<typeof brainDumpAnalysisSchema>;
