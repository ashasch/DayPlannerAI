import type { IsoDate } from '@/lib/tasks/types';

/**
 * Plain-date helpers.
 *
 * Everything here works in the *local* timezone and on calendar days, never on
 * instants. `new Date('2026-07-25')` parses as UTC midnight, which renders as
 * the 24th anywhere west of Greenwich — so dates are always built and read
 * through these functions instead of the Date string constructor.
 */

/** Formats a `Date` as `YYYY-MM-DD` using its local calendar fields. */
export function toIsoDate(date: Date): IsoDate {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/** Parses `YYYY-MM-DD` into a local `Date` at midday. */
export function fromIsoDate(iso: IsoDate): Date {
  const [year, month, day] = iso.split('-').map(Number);

  // Midday, so a ±1h DST shift can never roll the date to a neighbouring day.
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1, 12, 0, 0, 0);
}

/** True when the string is a well-formed, real calendar date. */
export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const parsed = fromIsoDate(value);
  // Round-tripping rejects impossible dates like 2026-02-31, which the Date
  // constructor would silently roll forward to March.
  return toIsoDate(parsed) === value;
}

/** Today in the local timezone. */
export function todayIso(): IsoDate {
  return toIsoDate(new Date());
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  // Anchor to the 1st first: adding a month to the 31st would otherwise skip a
  // month entirely (Jan 31 + 1 month = Mar 3).
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  return next;
}

/** Monday-based start of the week containing `date`. */
export function startOfWeek(date: Date): Date {
  const start = new Date(date);
  // getDay(): 0 = Sunday. Shift so Monday is 0.
  const offset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - offset);
  start.setHours(12, 0, 0, 0);
  return start;
}

export function startOfMonth(date: Date): Date {
  const start = new Date(date);
  start.setDate(1);
  start.setHours(12, 0, 0, 0);
  return start;
}

/** The seven days of the week containing `date`, Monday first. */
export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

/**
 * A six-row month grid, padded with neighbouring days so every row has seven
 * cells. Always six rows, so switching months never changes the grid height.
 */
export function getMonthGrid(date: Date): Date[][] {
  const gridStart = startOfWeek(startOfMonth(date));

  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(gridStart, week * 7 + day)),
  );
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Whole days from today to `iso`; negative for the past. */
export function daysFromToday(iso: IsoDate): number {
  const target = fromIsoDate(iso);
  const today = fromIsoDate(todayIso());

  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}
