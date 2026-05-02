ALTER TABLE "doctor_feedback_voice_notes" ADD COLUMN IF NOT EXISTS "patient_listened_at" timestamp with time zone;
ALTER TABLE "doctor_feedback_voice_notes" ADD COLUMN IF NOT EXISTS "patient_archived_at" timestamp with time zone;
UPDATE "doctor_feedback_voice_notes"
SET "patient_listened_at" = "created_at"
WHERE "patient_listened_at" IS NULL;
