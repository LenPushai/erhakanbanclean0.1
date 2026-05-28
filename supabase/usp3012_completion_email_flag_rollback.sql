-- US-P3-012 rollback: remove the cron idempotency flag + index.
-- Safe to run even if the cron has stamped some rows — the column is
-- a passive marker, not load-bearing for any other consumer.

DROP INDEX IF EXISTS public.idx_rfqs_completion_email_pending;

ALTER TABLE public.rfqs
  DROP COLUMN IF EXISTS completion_email_sent_at;
