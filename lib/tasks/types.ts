/**
 * Task vocabulary shared by the AI layer, the database schema and the UI.
 *
 * Lives outside both `lib/ai` and `lib/db` so neither has to depend on the
 * other just to agree on what a priority is.
 */

import type { TaskCategory } from './categories';

export type { TaskCategory };
export { TASK_CATEGORIES, isTaskCategory, normaliseCategory } from './categories';

export const TASK_PRIORITIES = ['high', 'medium', 'low'] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

/**
 * A calendar day with no time component, formatted `YYYY-MM-DD`.
 *
 * Deliberately a plain date rather than a timestamp: "do this on the 25th"
 * means the 25th wherever the user happens to be, and storing an instant would
 * make the task drift to a neighbouring day across timezones or DST.
 */
export type IsoDate = string;

/** A task as stored and rendered. */
export interface Task {
  id: string;
  title: string;
  priority: TaskPriority;
  category: TaskCategory | null;
  estimatedMinutes: number | null;
  /** `null` means unscheduled — it lives in the Inbox but not the calendar. */
  plannedDate: IsoDate | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

/** A task the AI proposed but the user has not saved yet. */
export interface TaskDraft {
  title: string;
  priority: TaskPriority;
  category: TaskCategory | null;
  estimatedMinutes: number | null;
  plannedDate: IsoDate | null;
}

/**
 * A draft with a client-side identity.
 *
 * The id exists purely so React can tell drafts apart across re-analyses.
 * Deriving a key from the title (or its index) collides whenever two analyses
 * produce the same task, which leaves list items stuck mid-animation.
 */
export interface DraftItem extends TaskDraft {
  id: string;
}

/** Generates a client-side draft id, falling back where `randomUUID` is absent. */
export function createDraftId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
