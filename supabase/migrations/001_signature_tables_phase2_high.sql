-- =====================================================================
-- 001_signature_tables_phase2_high.sql
-- US-023 Phase 2 HIGH-tier remediation — e-sign tables.
-- Authored 2026-05-16. Reviewed before apply — see status log in
-- decisions/US-023-schema-migration.md.
-- =====================================================================
--
-- Scope (findings A, B-partial, G per US-023_esign_audit.md):
--   1. DELETE 2 audit-confirmed orphan test rows from quote_signatures
--   2. FK signature_tokens.rfq_id  -> rfqs.id              ON DELETE RESTRICT
--   3. FK quote_signatures.rfq_id  -> rfqs.id              ON DELETE RESTRICT
--   4. quote_signatures.rfq_id     SET NOT NULL            (Finding G)
--   5. ADD COLUMN quote_signatures.signature_token_id uuid (NULLABLE)
--   6. FK quote_signatures.signature_token_id -> signature_tokens.id ON DELETE RESTRICT
--   7. signature_token_id NOT NULL deferred to US-024 — see rationale below
--
-- =====================================================================
-- *** ONE-SHOT MIGRATION — not idempotent by design ***
-- =====================================================================
-- Accidental re-run aborts at the Step 1 DELETE count guard and rolls
-- back the full transaction (safe to misfire, not re-appliable like the
-- Phase 1 baseline).
--
-- =====================================================================
-- *** ADR-006 OVERRIDE — ON DELETE RESTRICT instead of CASCADE ***
-- =====================================================================
-- The CASCADE choice originated as a derivation in
-- decisions/US-023-schema-migration.md from ADR-006's framing that
-- signing artefacts "belong to the RFQ". That derivation is retired in
-- the ADR-006 FK Activation & Delete-Semantics Amendment (2026-05-16),
-- which is landing in the same commit as this migration.
--
-- Rationale: signature evidence of customer assent must not be silently
-- destroyed when its parent RFQ is deleted. RESTRICT forces a deliberate
-- two-step (delete signatures first, then delete RFQ) and surfaces
-- accidental wipes loudly. Cascading deletion of legal evidence is the
-- exact failure mode an audit trail is supposed to prevent.
--
-- =====================================================================
-- *** signature_token_id NOT NULL deferred to US-024 ***
-- =====================================================================
-- Column added NULLABLE on purpose. Current code in api/sign-submit.js
-- inserts quote_signatures rows without populating signature_token_id,
-- so a NOT NULL constraint applied now would break the production
-- sign-submit flow on the very next signature. The constraint
-- tightening lands in US-024 in the same PR as the api/sign-submit.js
-- change that populates the column, so schema and code move together.
--
-- The exact location of the INSERT in api/sign-submit.js must be
-- re-verified at US-024 implementation time — line numbers in this file
-- have drifted before (e.g. during the US-023.5 server-side refactor).
--
-- =====================================================================
-- PRE-DELETE EVIDENCE — rows are recoverable from this comment block.
-- =====================================================================
-- Captured via:
--   select id, rfq_id, quote_number, signature_stage,
--          signer_name, signer_email, signer_title, signer_company,
--          signature_type, signed_at,
--          ip_address, user_agent,
--          quote_total, quote_description, status, created_at,
--          length(signature_data) as sig_data_len,
--          left(signature_data, 64) as sig_data_prefix
--     from public.quote_signatures
--    where id in ('c3a66453-27f0-477b-8cf4-65098697fc4b',
--                 '1f8d1eb7-c47f-4eb4-ab86-ce0f45519e30');
--
-- ROW 1 (id = c3a66453-27f0-477b-8cf4-65098697fc4b):
--   rfq_id            = b3c02436-a08c-454b-9699-01ed3640b020  (no matching rfqs row)
--   quote_number      = Q001
--   signature_stage   = manager
--   signer_name       = Hendrik
--   signer_email      = hendrik@erha.co.za
--   signer_title      = null
--   signer_company    = ERHA Fabrication & Construction
--   signature_type    = drawn
--   signed_at         = 2026-05-10 10:38:09.460985+00
--   ip_address        = ::1   (IPv6 localhost — signed on dev machine)
--   user_agent        = Mozilla/5.0 (Windows NT 10.0; Win64; x64) ... Edg/147.0.0.0
--   quote_total       = 1.00  (placeholder)
--   quote_description = Testing
--   status            = SIGNED
--   created_at        = 2026-05-10 10:38:09.460985+00
--   signature_data    = 8486 bytes; prefix: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAjAAAACgCAYAAAASCFYFAAAQAElEQVR4Ae
--
-- ROW 2 (id = 1f8d1eb7-c47f-4eb4-ab86-ce0f45519e30):
--   rfq_id            = b3c02436-a08c-454b-9699-01ed3640b020  (no matching rfqs row)
--   quote_number      = Q001
--   signature_stage   = client
--   signer_name       = Test Customer
--   signer_email      = len@gmail.com
--   signer_title      = Procurement Manager
--   signer_company    = null
--   signature_type    = drawn
--   signed_at         = 2026-05-10 11:19:51.883343+00
--   ip_address        = ::1   (IPv6 localhost — signed on dev machine)
--   user_agent        = Mozilla/5.0 (Windows NT 10.0; Win64; x64) ... Edg/147.0.0.0
--   quote_total       = 1.00  (placeholder)
--   quote_description = Testing
--   status            = SIGNED
--   created_at        = 2026-05-10 11:19:51.883343+00
--   signature_data    = 12370 bytes; prefix: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAjAAAACgCAYAAAASCFYFAAAQAElEQVR4Ae
--
-- Audit confirmation (2026-05-16) — conclusive: ip_address=::1 on both
-- rows (IPv6 localhost — created on dev machine, not remote signers);
-- quote_total=1.00 placeholder; quote_description='Testing'. The two
-- rows form a coordinated two-stage test transaction — same rfq_id
-- (b3c02436..., no matching rfqs row), same quote_number Q001. Hendrik
-- manager-signed at 10:38:09 then a "Test Customer" client-signed 41
-- minutes later at 11:19:51 on 2026-05-10. ROW 2's signer_email
-- (len@gmail.com) is the developer's personal address used as the
-- "customer" during smoke testing. Both rows predate real customer data.
-- =====================================================================

begin;

-- ----------------------------------------------------------------------
-- Step 1 — DELETE the 2 audit-confirmed orphan test rows by explicit id.
-- Verifies exactly 2 rows were deleted; raises if not (typo guard and
-- one-shot re-run guard — see ONE-SHOT header note).
-- ----------------------------------------------------------------------
do $$
declare deleted_count int;
begin
  with d as (
    delete from public.quote_signatures
     where id in (
       'c3a66453-27f0-477b-8cf4-65098697fc4b',
       '1f8d1eb7-c47f-4eb4-ab86-ce0f45519e30'
     )
     returning id
  )
  select count(*) into deleted_count from d;

  if deleted_count <> 2 then
    raise exception 'Phase 2 HIGH DELETE: expected exactly 2 rows, got %', deleted_count;
  end if;

  raise notice 'Phase 2 HIGH: deleted % orphan quote_signatures rows', deleted_count;
end $$;

-- ----------------------------------------------------------------------
-- Step 2 — Re-verify orphan counts are now zero before adding FKs.
-- Belt-and-braces: catches the case where a new orphan was inserted
-- between pre-check and apply.
-- ----------------------------------------------------------------------
do $$
declare bad_tokens int; bad_sigs int;
begin
  select count(*) into bad_tokens from public.signature_tokens t
    where not exists (select 1 from public.rfqs r where r.id = t.rfq_id);

  select count(*) into bad_sigs from public.quote_signatures s
    where not exists (select 1 from public.rfqs r where r.id = s.rfq_id);

  if bad_tokens > 0 or bad_sigs > 0 then
    raise exception 'Phase 2 HIGH orphan re-check failed after DELETE: % signature_tokens orphan, % quote_signatures orphan',
      bad_tokens, bad_sigs;
  end if;
end $$;

-- ----------------------------------------------------------------------
-- Step 3 — Finding A: FKs rfq_id -> rfqs.id, ON DELETE RESTRICT.
-- *** ADR-006 override — see header ***
-- ----------------------------------------------------------------------
alter table public.signature_tokens
  add constraint signature_tokens_rfq_fk
  foreign key (rfq_id) references public.rfqs(id) on delete restrict;

alter table public.quote_signatures
  add constraint quote_signatures_rfq_fk
  foreign key (rfq_id) references public.rfqs(id) on delete restrict;

-- ----------------------------------------------------------------------
-- Step 4 — Finding G: NOT NULL on quote_signatures.rfq_id.
-- Pre-check A3 = 0 on 2026-05-16, and Step 1 cleared the only rows that
-- could ever have been NULL going forward.
-- ----------------------------------------------------------------------
alter table public.quote_signatures
  alter column rfq_id set not null;

-- ----------------------------------------------------------------------
-- Step 5 — Finding B (column): ADD COLUMN signature_token_id uuid NULLABLE.
-- NOT NULL deferred to US-024 — see header rationale.
-- ----------------------------------------------------------------------
alter table public.quote_signatures
  add column if not exists signature_token_id uuid;

-- ----------------------------------------------------------------------
-- Step 6 — Finding B (FK): signature_token_id -> signature_tokens.id,
-- ON DELETE RESTRICT. Validates trivially against an empty column.
-- *** ADR-006 override — see header ***
-- ----------------------------------------------------------------------
alter table public.quote_signatures
  add constraint quote_signatures_token_fk
  foreign key (signature_token_id) references public.signature_tokens(id) on delete restrict;

commit;

-- =====================================================================
-- Post-apply verification (run manually after commit):
--
-- 1. Confirm 3 FKs landed with RESTRICT semantics:
--
--   select conname, pg_get_constraintdef(oid)
--     from pg_constraint
--    where conrelid in ('public.signature_tokens'::regclass,
--                       'public.quote_signatures'::regclass)
--      and contype = 'f'
--    order by conname;
--
--   Expected:
--     quote_signatures_rfq_fk    FOREIGN KEY (rfq_id)              REFERENCES rfqs(id)            ON DELETE RESTRICT
--     quote_signatures_token_fk  FOREIGN KEY (signature_token_id)  REFERENCES signature_tokens(id) ON DELETE RESTRICT
--     signature_tokens_rfq_fk    FOREIGN KEY (rfq_id)              REFERENCES rfqs(id)            ON DELETE RESTRICT
--
-- 2. Confirm rfq_id is now NOT NULL on quote_signatures:
--
--   select column_name, is_nullable
--     from information_schema.columns
--    where table_schema = 'public'
--      and table_name = 'quote_signatures'
--      and column_name in ('rfq_id', 'signature_token_id');
--
--   Expected:
--     rfq_id              | NO
--     signature_token_id  | YES
--
-- 3. Confirm both orphan rows are gone:
--
--   select count(*) from public.quote_signatures
--    where id in ('c3a66453-27f0-477b-8cf4-65098697fc4b',
--                 '1f8d1eb7-c47f-4eb4-ab86-ce0f45519e30');
--
--   Expected: 0
-- =====================================================================
