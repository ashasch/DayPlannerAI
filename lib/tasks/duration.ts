/**
 * Estimate bounds and presets.
 *
 * The minimum is a product decision, not a technical one: anything under five
 * minutes is noise in a day plan, and letting "1 minute" through mostly means
 * someone fat-fingered the input.
 */
export const MIN_ESTIMATE_MINUTES = 5;

/** One full day. Beyond this it is a project, not a task. */
export const MAX_ESTIMATE_MINUTES = 60 * 24;

/** Offered in the picker; anything else goes through the custom input. */
export const ESTIMATE_PRESETS = [15, 30, 45, 60, 90, 120, 180] as const;

/** Splits a duration into whole hours and leftover minutes. */
export function splitDuration(totalMinutes: number): { hours: number; minutes: number } {
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
}

/**
 * Coerces an arbitrary number into a storable estimate, or `null`.
 *
 * Used on the AI's output as well as on user input: the model occasionally
 * proposes a 2-minute task, and without clamping that single value would fail
 * validation and reject the entire batch the user was trying to save.
 */
export function clampEstimate(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;

  const rounded = Math.round(value);
  if (rounded <= 0) return null;

  return Math.min(Math.max(rounded, MIN_ESTIMATE_MINUTES), MAX_ESTIMATE_MINUTES);
}
