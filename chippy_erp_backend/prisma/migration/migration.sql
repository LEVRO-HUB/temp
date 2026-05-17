-- Phase 1 Migration: Booking status lifecycle + Room rate + conflict prevention support
-- Run this directly in your PostgreSQL database (via psql or Supabase SQL editor)

-- 1. Create BookingStatus enum
DO $$ BEGIN
  CREATE TYPE "BookingStatus" AS ENUM ('confirmed', 'checked_in', 'checked_out', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Add status column to Booking (default 'confirmed' for all existing bookings)
ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "status" "BookingStatus" NOT NULL DEFAULT 'confirmed';

-- 3. Add actual check-in / check-out timestamps to Booking
ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "actual_check_in"  TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "actual_check_out" TIMESTAMP(3);

-- 4. Add rate_per_night snapshot to Booking (frozen at time of booking)
ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "rate_per_night" DECIMAL(10, 2);

-- 5. Add remarks to Booking (if not already present)
ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "remarks" TEXT;

-- 6. Add rate_per_night to Room master
ALTER TABLE "Room"
  ADD COLUMN IF NOT EXISTS "rate_per_night" DECIMAL(10, 2);

-- 7. Add index on Booking.status for fast filtering
CREATE INDEX IF NOT EXISTS "Booking_status_idx" ON "Booking"("status");

-- Done. Now run: npx prisma generate (no migrate needed since we ran SQL directly)
