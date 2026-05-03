ALTER TABLE "patient_schedule_requests"
ADD COLUMN "issue" text DEFAULT 'Skin concern' NOT NULL;
--> statement-breakpoint
ALTER TABLE "patient_schedule_requests"
ADD COLUMN "days_affected" integer;
--> statement-breakpoint
ALTER TABLE "patient_schedule_requests"
ADD COLUMN "attachments" jsonb;
