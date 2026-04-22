CREATE TABLE IF NOT EXISTS "annotator_images" (
  "id" serial PRIMARY KEY NOT NULL,
  "file_name" varchar(255) NOT NULL,
  "mime_type" varchar(100) NOT NULL,
  "data_uri" text NOT NULL,
  "sort_order" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "annotator_images_sort_order_uidx"
  ON "annotator_images" ("sort_order");

CREATE TABLE IF NOT EXISTS "annotator_state" (
  "id" serial PRIMARY KEY NOT NULL,
  "scope" varchar(64) DEFAULT 'default' NOT NULL,
  "per_image_by_category" jsonb,
  "annotations" jsonb,
  "current_index" integer DEFAULT 0 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "annotator_state_scope_uidx"
  ON "annotator_state" ("scope");
