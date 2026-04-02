ALTER TABLE "chat_threads" ADD COLUMN IF NOT EXISTS "patient_cleared_chat_at" timestamp with time zone;
