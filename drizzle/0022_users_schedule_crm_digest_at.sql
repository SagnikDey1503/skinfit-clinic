ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "schedule_crm_digest_at" timestamp with time zone;
