-- ============================================================
-- Phase 2C Part 1 Migration - Room rates for booking/checkout
-- Run this in your Supabase SQL editor before deploying backend
-- ============================================================

ALTER TABLE "Room"
  ADD COLUMN IF NOT EXISTS "rate_per_night" NUMERIC(10, 2);

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'Room'
  AND column_name = 'rate_per_night';
