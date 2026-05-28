-- US-P3-012 forward: extend rfqs.status CHECK constraint to support the
-- eight-lane RFQ board. Adds two intermediate values:
--   - INTERNALLY_APPROVED  (Hendrik has signed off, Jeanic to send to customer)
--   - COMPLETED            (all linked jobs invoiced; populated by trigger)
-- JOB_CREATED is preserved (cards transit through it invisibly between
-- ACCEPTED and COMPLETED). See decisions/US-P3-012-eight-lane-rfq-board.md.
--
-- Idempotent: DROP CONSTRAINT IF EXISTS handles re-runs. The constraint
-- name follows the workshop_status precedent (jobs_workshop_status_check).

ALTER TABLE public.rfqs
  DROP CONSTRAINT IF EXISTS rfqs_status_check;

ALTER TABLE public.rfqs
  ADD CONSTRAINT rfqs_status_check
  CHECK (status IN (
    'NEW',
    'PENDING',
    'QUOTED',
    'INTERNALLY_APPROVED',
    'SENT_TO_CUSTOMER',
    'ACCEPTED',
    'JOB_CREATED',
    'COMPLETED',
    'REJECTED'
  ));
