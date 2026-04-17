-- CR-6: Workshop Board Three New Columns
-- Run this in Supabase SQL Editor

-- Update workshop_status CHECK constraint to include new statuses
ALTER TABLE public.jobs
  DROP CONSTRAINT IF EXISTS jobs_workshop_status_check;

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_workshop_status_check
  CHECK (workshop_status IN (
    'NOT_STARTED',
    'IN_PROGRESS',
    'ON_HOLD',
    'QUALITY_CHECK',
    'COMPLETE',
    'DISPATCHED',
    'DELIVERED',
    'INVOICED',
    'COMPLETED'
  ));

NOTIFY pgrst, 'reload schema';
