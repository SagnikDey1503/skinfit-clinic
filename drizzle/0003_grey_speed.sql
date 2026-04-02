CREATE TYPE "public"."appointment_request_status" AS ENUM('pending', 'approved', 'cancelled');--> statement-breakpoint
CREATE TABLE "appointment_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"doctor_id" uuid NOT NULL,
	"doctor_slot_id" uuid NOT NULL,
	"issue" text NOT NULL,
	"why" text,
	"status" "appointment_request_status" DEFAULT 'pending' NOT NULL,
	"appointment_id" uuid,
	"cancelled_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctor_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" uuid NOT NULL,
	"slot_date" date NOT NULL,
	"slot_time" varchar(5) NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_doctor_slot_id_doctor_slots_id_fk" FOREIGN KEY ("doctor_slot_id") REFERENCES "public"."doctor_slots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_slots" ADD CONSTRAINT "doctor_slots_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "appointment_requests_patient_doctor_slot_uidx" ON "appointment_requests" USING btree ("patient_id","doctor_id","doctor_slot_id");--> statement-breakpoint
CREATE UNIQUE INDEX "doctor_slots_doctor_date_time_uidx" ON "doctor_slots" USING btree ("doctor_id","slot_date","slot_time");