-- Routine reminder preferences + dedup markers (Clinic Support chat)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "timezone" varchar(64) NOT NULL DEFAULT 'Asia/Kolkata';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "routine_reminders_enabled" boolean NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "routine_am_reminder_hm" varchar(5) NOT NULL DEFAULT '08:30';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "routine_pm_reminder_hm" varchar(5) NOT NULL DEFAULT '22:00';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "routine_am_reminder_last_sent_ymd" varchar(10);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "routine_pm_reminder_last_sent_ymd" varchar(10);
