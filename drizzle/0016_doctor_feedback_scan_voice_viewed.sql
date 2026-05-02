ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "doctor_feedback_scan_voice_viewed_at" timestamp with time zone;
UPDATE "users"
SET "doctor_feedback_scan_voice_viewed_at" = "doctor_feedback_viewed_at"
WHERE "doctor_feedback_viewed_at" IS NOT NULL
  AND "doctor_feedback_scan_voice_viewed_at" IS NULL;
