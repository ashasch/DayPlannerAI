/**
 * Task categories.
 *
 * The stored value is always one of these English codes. Every user-facing
 * label comes from `messages/*.json` via `tasks.category.*`, so a category
 * never reaches the database in whatever language the user happened to type —
 * which is how the same bucket previously ended up as both `home` and `дім`.
 */
export const TASK_CATEGORIES = [
  'work',
  'home',
  'health',
  'education',
  'leisure',
  'personal',
  'finance',
  'social',
  'other',
] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export function isTaskCategory(value: unknown): value is TaskCategory {
  return typeof value === 'string' && (TASK_CATEGORIES as readonly string[]).includes(value);
}

/**
 * Legacy and free-text values mapped onto canonical codes.
 *
 * Covers what the model produced before the prompt was constrained: Ukrainian
 * words, plurals and near-synonyms. Keys are compared lower-cased and trimmed.
 * Anything unrecognised becomes `other` rather than being dropped — losing a
 * user's categorisation is worse than filing it imprecisely.
 */
const CATEGORY_ALIASES: Record<string, TaskCategory> = {
  // Ukrainian
  робота: 'work',
  праця: 'work',
  дім: 'home',
  дом: 'home',
  дома: 'home',
  побут: 'home',
  господарство: 'home',
  "здоров'я": 'health',
  здоровя: 'health',
  здоровье: 'health',
  спорт: 'health',
  навчання: 'education',
  освіта: 'education',
  вчитися: 'education',
  дозвілля: 'leisure',
  відпочинок: 'leisure',
  хобі: 'leisure',
  особисте: 'personal',
  особистий: 'personal',
  фінанси: 'finance',
  гроші: 'finance',
  спілкування: 'social',
  друзі: 'social',
  сім_я: 'social',
  соціальне: 'social',
  інше: 'other',
  разное: 'other',

  // English variants the model has produced
  job: 'work',
  career: 'work',
  house: 'home',
  household: 'home',
  chores: 'home',
  family: 'social',
  friends: 'social',
  fitness: 'health',
  wellbeing: 'health',
  study: 'education',
  learning: 'education',
  school: 'education',
  hobby: 'leisure',
  fun: 'leisure',
  money: 'finance',
  finances: 'finance',
  admin: 'personal',
  errands: 'personal',
  misc: 'other',
};

/**
 * Coerces any incoming value to a canonical category.
 *
 * Returns `null` only for genuinely absent input — an unrecognised non-empty
 * value falls back to `other`.
 */
export function normaliseCategory(value: string | null | undefined): TaskCategory | null {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim().toLowerCase();
  if (trimmed === '') return null;

  if (isTaskCategory(trimmed)) return trimmed;

  // Apostrophes vary (’ vs ') and spaces/hyphens appear in free text.
  const key = trimmed.replace(/[’`]/g, "'").replace(/[\s-]+/g, '_');

  return CATEGORY_ALIASES[key] ?? CATEGORY_ALIASES[trimmed] ?? 'other';
}
