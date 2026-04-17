-- CR-05: Line Item Tracking Columns
-- Run this in Supabase SQL Editor

ALTER TABLE public.job_line_items
  ADD COLUMN IF NOT EXISTS qc_done BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS qc_done_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS qc_done_by TEXT,
  ADD COLUMN IF NOT EXISTS ready_for_delivery BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ready_for_delivery_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ready_for_delivery_by TEXT,
  ADD COLUMN IF NOT EXISTS dispatched BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_number TEXT,
  ADD COLUMN IF NOT EXISTS delivery_date DATE,
  ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dispatched_by TEXT;

NOTIFY pgrst, 'reload schema';
