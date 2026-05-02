ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "routine_plan_am_items" jsonb;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "routine_plan_pm_items" jsonb;

-- Existing onboarded patients: keep current default checklist behavior until their doctor edits the plan.
UPDATE "users"
SET
  "routine_plan_am_items" = '["Gentle Cleanser","Toner","Serum","Moisturiser","Spf"]'::jsonb,
  "routine_plan_pm_items" = '["Oil Cleanser","Toner","Retinol","Serum","Night Cream"]'::jsonb
WHERE
  "role" = 'patient'
  AND "onboarding_complete" = true
  AND (
    "routine_plan_am_items" IS NULL
    OR "routine_plan_pm_items" IS NULL
    OR jsonb_array_length(coalesce("routine_plan_am_items", '[]'::jsonb)) = 0
    OR jsonb_array_length(coalesce("routine_plan_pm_items", '[]'::jsonb)) = 0
  );
