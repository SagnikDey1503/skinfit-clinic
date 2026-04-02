ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "appointment_reminder_hours_before" integer NOT NULL DEFAULT 24;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "clinic_reminder_sent_at" timestamp with time zone;--> statement-breakpoint
