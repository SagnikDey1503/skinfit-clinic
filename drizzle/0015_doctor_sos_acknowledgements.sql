CREATE TABLE IF NOT EXISTS "doctor_sos_acknowledgements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "staff_user_id" uuid NOT NULL,
  "chat_message_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "doctor_sos_acknowledgements_staff_user_id_users_id_fk" FOREIGN KEY ("staff_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT "doctor_sos_acknowledgements_chat_message_id_chat_messages_id_fk" FOREIGN KEY ("chat_message_id") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT "doctor_sos_ack_staff_message_uidx" UNIQUE ("staff_user_id","chat_message_id")
);
CREATE INDEX IF NOT EXISTS "doctor_sos_ack_staff_idx" ON "doctor_sos_acknowledgements" ("staff_user_id");
