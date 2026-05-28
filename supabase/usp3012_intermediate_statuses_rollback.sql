-- US-P3-012 rollback: revert rfqs.status CHECK constraint to the
-- pre-US-P3-012 seven-value set.
--
-- WARNING: this rollback will FAIL if any rfqs row has status =
-- 'INTERNALLY_APPROVED' or 'COMPLETED'. Before running, identify and
-- migrate those rows:
--
--   SELECT id, rfq_no, status FROM rfqs
--     WHERE status IN ('INTERNALLY_APPROVED','COMPLETED');
--
-- Typical remediation:
--   - INTERNALLY_APPROVED -> QUOTED   (re-quote / re-sign required)
--   - COMPLETED           -> JOB_CREATED (treat as pre-trigger state)

ALTER TABLE public.rfqs
  DROP CONSTRAINT IF EXISTS rfqs_status_check;

ALTER TABLE public.rfqs
  ADD CONSTRAINT rfqs_status_check
  CHECK (status IN (
    'NEW',
    'PENDING',
    'QUOTED',
    'SENT_TO_CUSTOMER',
    'ACCEPTED',
    'JOB_CREATED',
    'REJECTED'
  ));