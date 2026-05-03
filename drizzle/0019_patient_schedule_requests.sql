-- Patient visit requests (preferred date + time notes). Clinic CRM updates Google Sheet;
-- Apps Script or automation POSTs to /api/integrations/clinic-sheet/appointments to confirm/cancel.

CREATE TYPE "public"."patient_schedule_request_status" AS ENUM('pending', 'confirmed', 'cancelled', 'declined');
--> statement-breakpoint

CREATE TABLE "patient_schedule_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"doctor_id" uuid,
	"preferred_date" date NOT NULL,
	"time_preferences" text NOT NULL,
	"status" "patient_schedule_request_status" DEFAULT 'pending' NOT NULL,
	"external_ref" text,
	"confirmed_at" timestamp with time zone,
	"cancelled_reason" text,
	"appointment_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

ALTER TABLE "patient_schedule_requests" ADD CONSTRAINT "patient_schedule_requests_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "patient_schedule_requests" ADD CONSTRAINT "patient_schedule_requests_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "patient_schedule_requests" ADD CONSTRAINT "patient_schedule_requests_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint

CREATE INDEX "patient_schedule_requests_patient_idx" ON "patient_schedule_requests" USING btree ("patient_id");
--> statement-breakpoint
CREATE INDEX "patient_schedule_requests_status_idx" ON "patient_schedule_requests" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "patient_schedule_requests_external_ref_idx" ON "patient_schedule_requests" USING btree ("external_ref");
