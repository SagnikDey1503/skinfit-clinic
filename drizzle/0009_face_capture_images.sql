-- Multi–face-capture AI scan: ordered pose images (JSON); legacy rows stay null
ALTER TABLE "scans" ADD COLUMN IF NOT EXISTS "face_capture_images" jsonb;
