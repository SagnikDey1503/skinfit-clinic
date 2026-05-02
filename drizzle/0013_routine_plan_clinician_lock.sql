ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "routine_plan_clinician_locked" boolean NOT NULL DEFAULT false;

-- Anyone whose stored plan already differs from the built-in template is treated as clinician-owned
-- so scheduled sync does not overwrite unknown customizations.
WITH tpl(am, pm) AS (
  SELECT
    '["Gentle Cleanser","Toner","Serum","Moisturiser","Spf"]'::jsonb,
    '["Oil Cleanser","Toner","Retinol","Serum","Night Cream"]'::jsonb
)
UPDATE "users" u
SET "routine_plan_clinician_locked" = true
FROM tpl
WHERE u."role" = 'patient'
  AND u."routine_plan_am_items" IS NOT NULL
  AND u."routine_plan_pm_items" IS NOT NULL
  AND (
    u."routine_plan_am_items" IS DISTINCT FROM tpl.am
    OR u."routine_plan_pm_items" IS DISTINCT FROM tpl.pm
  );
