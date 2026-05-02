-- Remove auto-copied default AM/PM lists for patients still on "awaiting clinician plan".
-- Locked plans (clinician-saved) are unchanged.
UPDATE "users"
SET
  "routine_plan_am_items" = '[]'::jsonb,
  "routine_plan_pm_items" = '[]'::jsonb
WHERE "role" = 'patient'
  AND "onboarding_complete" = true
  AND "routine_plan_clinician_locked" = false;
