CREATE TYPE "public"."task_category" AS ENUM('work', 'home', 'health', 'education', 'leisure', 'personal', 'finance', 'social', 'other');--> statement-breakpoint
-- Normalise existing free-text values BEFORE the cast.
--
-- The column previously accepted anything the model returned, so it holds a
-- mix of English codes and Ukrainian words ("дім", "здоров'я", "особисте").
-- Casting straight to the enum would abort on the first of those, so map the
-- known values first, blank out anything still unrecognised, and only then
-- change the type. Mirrors CATEGORY_ALIASES in lib/tasks/categories.ts.
UPDATE "tasks" SET "category" = CASE lower(btrim("category"))
  WHEN 'робота' THEN 'work'
  WHEN 'праця' THEN 'work'
  WHEN 'job' THEN 'work'
  WHEN 'career' THEN 'work'
  WHEN 'дім' THEN 'home'
  WHEN 'дом' THEN 'home'
  WHEN 'дома' THEN 'home'
  WHEN 'побут' THEN 'home'
  WHEN 'господарство' THEN 'home'
  WHEN 'house' THEN 'home'
  WHEN 'household' THEN 'home'
  WHEN 'chores' THEN 'home'
  WHEN 'здоров''я' THEN 'health'
  WHEN 'здоров’я' THEN 'health'
  WHEN 'здоровя' THEN 'health'
  WHEN 'здоровье' THEN 'health'
  WHEN 'спорт' THEN 'health'
  WHEN 'fitness' THEN 'health'
  WHEN 'wellbeing' THEN 'health'
  WHEN 'навчання' THEN 'education'
  WHEN 'освіта' THEN 'education'
  WHEN 'study' THEN 'education'
  WHEN 'learning' THEN 'education'
  WHEN 'school' THEN 'education'
  WHEN 'дозвілля' THEN 'leisure'
  WHEN 'відпочинок' THEN 'leisure'
  WHEN 'хобі' THEN 'leisure'
  WHEN 'hobby' THEN 'leisure'
  WHEN 'fun' THEN 'leisure'
  WHEN 'особисте' THEN 'personal'
  WHEN 'особистий' THEN 'personal'
  WHEN 'admin' THEN 'personal'
  WHEN 'errands' THEN 'personal'
  WHEN 'фінанси' THEN 'finance'
  WHEN 'гроші' THEN 'finance'
  WHEN 'money' THEN 'finance'
  WHEN 'finances' THEN 'finance'
  WHEN 'спілкування' THEN 'social'
  WHEN 'друзі' THEN 'social'
  WHEN 'сім''я' THEN 'social'
  WHEN 'соціальне' THEN 'social'
  WHEN 'family' THEN 'social'
  WHEN 'friends' THEN 'social'
  WHEN 'інше' THEN 'other'
  WHEN 'разное' THEN 'other'
  WHEN 'misc' THEN 'other'
  ELSE lower(btrim("category"))
END
WHERE "category" IS NOT NULL;--> statement-breakpoint
-- Anything still outside the enum becomes 'other' rather than being lost:
-- an imprecise bucket beats discarding the user's categorisation.
UPDATE "tasks" SET "category" = 'other'
WHERE "category" IS NOT NULL
  AND "category" NOT IN ('work', 'home', 'health', 'education', 'leisure', 'personal', 'finance', 'social', 'other');--> statement-breakpoint
-- Empty strings were never a category; treat them as absent.
UPDATE "tasks" SET "category" = NULL WHERE btrim(COALESCE("category", '')) = '';--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "category" SET DATA TYPE "public"."task_category" USING "category"::"public"."task_category";
