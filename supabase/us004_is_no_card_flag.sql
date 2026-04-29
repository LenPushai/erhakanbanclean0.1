BEGIN;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS is_no_card BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_jobs_is_no_card
  ON public.jobs(is_no_card)
  WHERE is_no_card = true;

NOTIFY pgrst, 'reload schema';

COMMIT;
