-- US-P3-012 forward: idempotency flag for the completion-email cron.
-- The DB trigger that promotes rfqs.status='JOB_CREATED' to 'COMPLETED'
-- has no email side-effect — the cron handler api/cron/notify-completed-rfqs.js
-- polls for COMPLETED rows with NULL completion_email_sent_at, sends the
-- email, and stamps the row. The partial index keeps the poll cheap even
-- as the COMPLETED population grows.

ALTER TABLE public.rfqs
  ADD COLUMN IF NOT EXISTS completion_email_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_rfqs_completion_email_pending
  ON public.rfqs (status, completion_email_sent_at)
  WHERE status = 'COMPLETED' AND completion_email_sent_at IS NULL;
