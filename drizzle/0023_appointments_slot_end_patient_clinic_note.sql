ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "slot_end_time" character varying(5);
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "patient_clinic_note" text;
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "patient_clinic_note_at" timestamp with time zone;
