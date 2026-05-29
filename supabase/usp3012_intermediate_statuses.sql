-- US-P3-012 forward: extend rfqs.status CHECK constraint to support the
-- eight-lane RFQ board. Adds two intermediate values:
--   - INTERNALLY_APPROVED  (Hendrik has signed off, Jeanic to send to customer)
--   - COMPLETED            (all linked jobs invoiced; populated by trigger)
-- JOB_CREATED is preserved (cards transit through it invisibly between
-- ACCEPTED and COMPLETED). See decisions/US-P3-012-eight-lane-rfq-board.md.
--
-- Idempotent: DROP CONSTRAINT IF EXISTS handles re-runs. The constraint
-- name follows the workshop_status precedent (jobs_workshop_status_check).
--
-- 2026-05-29 update: added pre-check SELECT + NOTIFY pgrst.
-- The bug that motivated this edit was that api/sign-submit.js silently
-- swallowed the constraint-violation error from an unrun migration —
-- production rfqs.status='QUOTED' rows could not be advanced to
-- INTERNALLY_APPROVED, but /sign showed a success card anyway.
-- Hardening the handler is in the same commit as this migration update.

-- ============================================================
-- PRE-CHECK (read-only). If this returns ANY rows, those rfqs
-- would violate the new constraint — fix or migrate them before
-- proceeding. Expected: zero rows on a healthy production DB.
-- ============================================================
SELECT id, rfq_no, status
  FROM public.rfqs
 WHERE status NOT IN (
   'NEW','PENDING','QUOTED','INTERNALLY_APPROVED',
   'SENT_TO_CUSTOMER','ACCEPTED','JOB_CREATED',
   'COMPLETED','REJECTED'
 );

-- ============================================================
-- Migration body — atomic. If ADD CONSTRAINT fails because a
-- row sneaked in between pre-check and apply, DROP rolls back.
-- ============================================================
BEGIN;

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

COMMIT;

-- ============================================================
-- Force PostgREST to reload its schema cache so the new CHECK
-- definition is visible to the API immediately.
-- ============================================================
NOTIFY pgrst, 'reload schema';
