-- ============================================================
-- Phase 2B Part 1 Migration — Check-In fields on Booking
-- Run this in your Supabase SQL editor BEFORE deploying backend
-- ============================================================

-- Add guest ID capture and arrival time fields to Booking
ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "id_type"      TEXT,
  ADD COLUMN IF NOT EXISTS "id_number"    TEXT,
  ADD COLUMN IF NOT EXISTS "arrival_time" TIMESTAMPTZ;

-- Optional: index for future queries by id_type
CREATE INDEX IF NOT EXISTS "Booking_id_type_idx" ON "Booking"("id_type");

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'Booking'
  AND column_name IN ('id_type', 'id_number', 'arrival_time');
