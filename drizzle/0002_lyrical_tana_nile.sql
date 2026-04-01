ALTER TABLE "users" ADD COLUMN "phone_country_code" varchar(8) DEFAULT '+91' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" varchar(32);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "age" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "skin_type" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "primary_goal" varchar(255);