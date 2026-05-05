-- =====================================================================
-- US-J1: client_contacts RLS + column rename (single-file fix)
-- File:  supabase/usj1_client_contacts_rename.sql
-- Date:  2026-05-05
--
-- Two bugs landed this fix:
--   (1) RLS enabled on client_contacts but no policies -> all DML 401
--   (2) Column drift: live cols 'phone'/'email' but React form sends
--       'contact_phone'/'contact_email' -> PGRST204 on insert
--
-- This file fixes both, idempotently:
--   - Block 1: rename phone->contact_phone, email->contact_email
--   - Block 2: create "Enable all access" policy if absent
--             (matches the live prod name + the Supabase Studio default)
--
-- Idempotent on every re-run:
--   * Already-renamed cols  -> rename block no-ops
--   * Already-existing policy -> policy block no-ops (no DROP churn)
--   * Both old AND new cols present -> abort (manual review)
--
-- Mid-UAT safety:
--   - Table has 0 rows (REST count probe); rename has zero data risk
--   - DDL bypasses RLS; lock window sub-ms on empty table
--   - Policy block uses pg_policy existence check, not DROP+CREATE,
--     so the live policy is not disturbed if already present
--   - React reads via select=*; pre-rename keys are undefined and
--     render as '-', post-rename they resolve. No intermediate error.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1) Column renames — idempotent guards
-- ---------------------------------------------------------------------
DO $$
DECLARE
  has_phone         boolean;
  has_contact_phone boolean;
  has_email         boolean;
  has_contact_email boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='client_contacts'
                    AND column_name='phone')
    INTO has_phone;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='client_contacts'
                    AND column_name='contact_phone')
    INTO has_contact_phone;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='client_contacts'
                    AND column_name='email')
    INTO has_email;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='client_contacts'
                    AND column_name='contact_email')
    INTO has_contact_email;

  -- phone -> contact_phone
  IF has_phone AND has_contact_phone THEN
    RAISE EXCEPTION 'client_contacts has BOTH phone and contact_phone — manual review required, aborting';
  ELSIF has_phone AND NOT has_contact_phone THEN
    ALTER TABLE public.client_contacts RENAME COLUMN phone TO contact_phone;
    RAISE NOTICE 'Renamed client_contacts.phone -> contact_phone';
  ELSE
    RAISE NOTICE 'client_contacts.contact_phone already in place — skipping';
  END IF;

  -- email -> contact_email
  IF has_email AND has_contact_email THEN
    RAISE EXCEPTION 'client_contacts has BOTH email and contact_email — manual review required, aborting';
  ELSIF has_email AND NOT has_contact_email THEN
    ALTER TABLE public.client_contacts RENAME COLUMN email TO contact_email;
    RAISE NOTICE 'Renamed client_contacts.email -> contact_email';
  ELSE
    RAISE NOTICE 'client_contacts.contact_email already in place — skipping';
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 2) RLS policy — create only if absent (idempotent for fresh clones)
--    Postgres does not support CREATE POLICY IF NOT EXISTS, so we
--    emulate it via a DO block that checks pg_policy first.
--    Name "Enable all access" matches both the live prod policy and
--    the Supabase Studio default template.
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_policy
     WHERE polrelid = 'public.client_contacts'::regclass
       AND polname  = 'Enable all access'
  ) THEN
    EXECUTE 'CREATE POLICY "Enable all access"
               ON public.client_contacts
               FOR ALL
               USING (true)
               WITH CHECK (true)';
    RAISE NOTICE 'Created policy "Enable all access" on client_contacts';
  ELSE
    RAISE NOTICE 'Policy "Enable all access" already exists — skipping';
  END IF;
END $$;

COMMIT;

-- =====================================================================
-- VERIFICATION — run after commit; output should show the 9 columns
-- with contact_phone/contact_email present, and the "Enable all access"
-- policy with polcmd='*', using=true, check=true.
-- =====================================================================

-- Final column set
SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name   = 'client_contacts'
 ORDER BY ordinal_position;

-- Final policy set
SELECT polname,
       polcmd,
       polroles::regrole[] AS roles,
       pg_get_expr(polqual,      polrelid) AS using_expr,
       pg_get_expr(polwithcheck, polrelid) AS check_expr
  FROM pg_policy
 WHERE polrelid = 'public.client_contacts'::regclass;