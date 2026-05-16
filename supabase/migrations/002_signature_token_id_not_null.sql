-- =====================================================================
-- 002_signature_token_id_not_null.sql
-- US-024a — close out signature_token_id NOT NULL deferred from US-023.
-- Authored 2026-05-16. Reviewed before apply — see status log in
-- decisions/US-023-schema-migration.md.
-- =====================================================================
--
-- Scope: ALTER COLUMN quote_signatures.signature_token_id SET NOT NULL.
--
-- Discharges the deferred half of ADR-006's FK Activation &
-- Delete-Semantics Amendment (2026-05-16), Decision 1.
--
-- Idempotency: PostgreSQL's SET NOT NULL on an already-NOT-NULL column
-- is a no-op. Re-applying after success is harmless. The pre-check is
-- the only meaningful state-dependent step.
--
-- =====================================================================
-- *** APPLICATION RUNBOOK — order is strict, deviations break prod ***
-- =====================================================================
-- DO NOT apply this migration in isolation. Strict order:
--
--   1. Commit US-024a (this file + the api/sign-submit.js code change
--      that populates signature_token_id on every quote_signatures
--      INSERT).
--   2. Push and confirm Vercel deploy succeeded; the new code is live.
--   3. Verify on the live deploy that NEW signatures populate
--      signature_token_id correctly (preferred: fire one smoke-test
--      Stage 1 signature on staging; sufficient: read the deployed
--      function source via Vercel logs / dashboard to confirm the new
--      field is present in the INSERT payload).
--   4. Re-run the IS NULL count against quote_signatures:
--        select count(*) as null_count
--          from public.quote_signatures
--         where signature_token_id is null;
--      Required: null_count = 0. If non-zero, those are gap-rows
--      inserted before step 1 deployed; either backfill them with the
--      correct historical token_id or delete them before proceeding.
--   5. ONLY THEN apply this migration via Supabase SQL Editor. The
--      Step 1 do-block below will RAISE EXCEPTION + roll back if any
--      NULL row is still present at apply time.
--   6. Run the post-apply verification query (bottom of this file).
--   7. Tag the apply-verified commit as
--      phase1-us024a-token-closure-verified.
--
-- The pre-check is defence-in-depth, not an excuse to skip step 4.
-- =====================================================================

begin;

-- ----------------------------------------------------------------------
-- Step 1 — Pre-check: every quote_signatures row must have a non-null
-- signature_token_id. Aborts loudly + rolls back if not.
-- ----------------------------------------------------------------------
do $$
declare null_count int; total_count int;
begin
  select count(*) into total_count from public.quote_signatures;

  select count(*) into null_count
    from public.quote_signatures
   where signature_token_id is null;

  if null_count > 0 then
    raise exception 'US-024a NOT NULL pre-check failed: % of % quote_signatures rows have NULL signature_token_id. Confirm api/sign-submit.js code change is live and backfill any gap rows before re-applying.', null_count, total_count;
  end if;

  raise notice 'US-024a pre-check ok: 0 NULL rows across % quote_signatures rows', total_count;
end $$;

-- ----------------------------------------------------------------------
-- Step 2 — Apply NOT NULL.
-- ----------------------------------------------------------------------
alter table public.quote_signatures
  alter column signature_token_id set not null;

commit;

-- =====================================================================
-- Post-apply verification (run manually after commit):
--
--   select column_name, is_nullable
--     from information_schema.columns
--    where table_schema = 'public'
--      and table_name = 'quote_signatures'
--      and column_name = 'signature_token_id';
--
--   Expected: signature_token_id | NO
-- =====================================================================
