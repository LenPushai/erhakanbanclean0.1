-- Job Number Sequence, RPC Function & Auto-trigger
-- Run this in Supabase SQL Editor

-- 1. Create the sequence
CREATE SEQUENCE IF NOT EXISTS public.job_number_seq START 1;

-- 2. Set the sequence to continue from the highest existing job number
--    Extracts the numeric suffix from all JOB-YY-NNN patterns and advances past the max
DO $$
DECLARE
  max_num INT;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(job_number FROM 'JOB-\d{2}-(\d+)') AS INT)
  ), 0)
  INTO max_num
  FROM public.jobs
  WHERE job_number ~ '^JOB-\d{2}-\d+$';

  -- setval with true means the NEXT nextval() call returns max_num + 1
  IF max_num > 0 THEN
    PERFORM setval('public.job_number_seq', max_num, true);
  END IF;
END $$;

-- 3. Create the RPC function (still available for ad-hoc use)
CREATE OR REPLACE FUNCTION public.generate_job_number()
RETURNS TEXT AS $$
DECLARE
  seq_val INT;
  year_str TEXT;
BEGIN
  seq_val := nextval('public.job_number_seq');
  year_str := to_char(now(), 'YY');
  RETURN 'JOB-' || year_str || '-' || lpad(seq_val::text, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- 4. Create the BEFORE INSERT trigger function
--    Auto-generates job_number for non-child jobs when not provided
CREATE OR REPLACE FUNCTION public.set_job_number()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.is_child_job IS NULL OR NEW.is_child_job = false)
     AND (NEW.job_number IS NULL OR NEW.job_number = '') THEN
    NEW.job_number := public.generate_job_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Drop existing trigger if present, then create
DROP TRIGGER IF EXISTS trg_set_job_number ON public.jobs;

CREATE TRIGGER trg_set_job_number
  BEFORE INSERT ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_job_number();
