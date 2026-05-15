# US-023-schema-migration — E-Sign tables: baseline capture + remediation plan

| Field   | Value                                                                                          |
| ------- | ---------------------------------------------------------------------------------------------- |
| Date    | 2026-05-16                                                                                     |
| Status  | **Phase 1 applied 2026-05-16 — Phase 2 plan-only**                                             |
| Author  | Len Klopper / PUSH AI                                                                          |
| Parent  | [US-023 e-sign audit](./US-023_esign_audit.md) — Findings A–G in the Schema Introspection Addendum |
| Related ADR | [ADR-006 — E-Sign Built-in Two-Stage](./ADR-006-e-sign-built-in-two-stage.md)              |
| Blocks  | US-024 (real recipient routing) must wait for HIGH-tier remediation (A, B) — see Phase 3   |

---

## Why this story exists

The e-sign tables (`signature_tokens`, `quote_signatures`) were created by hand during the e-sign v1 build window in early May 2026 with no migration files captured. The [US-023 audit](./US-023_esign_audit.md) surfaced seven schema findings (A–G).

This story splits cleanly into three phases:

- **Phase 1 — Baseline.** Capture the live schema as a version-controlled migration. Zero risk. Applies anytime. Closes the "schema not in source" drift gap.
- **Phase 2 — Remediation plan.** Severity-tiered SQL for findings A–G. **Plan only** in this doc — no migration files created yet. Each finding gets its own future migration file when applied so blast radius stays small and bisecting failure is trivial.
- **Phase 3 — Execution sequencing.** The order migrations are applied across the next few stories.

---

## Proposed location and tooling

- **Path:** `supabase/migrations/` — Supabase CLI convention.
- **Tooling:** `supabase migration new <name>` to author; `supabase db push` to apply to the linked project. Local dev: `supabase db reset` rebuilds from these files.
- **Project link:** Supabase project ref `lvaqqqyjqtguozmdjmfn` (same project US-023.5 was applied against).
- **Alternative (no CLI):** apply via SQL Editor in the Supabase Dashboard. The files in `supabase/migrations/` remain the source of truth either way.

---

## Phase 1 — Baseline migration

**File:** `supabase/migrations/000_baseline_signature_tables.sql`
**Risk:** Zero. Idempotent — uses `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`. Re-applying against the live DB is a no-op.
**Intent:** Capture the schema *exactly as observed* via introspection on 2026-05-16, including the redundant `idx_tokens_token` index. Phase 1 records reality; it does not fix it. Fixes live in Phase 2.
**Status:** **Applied 2026-05-16.** SQL file landed at `supabase/migrations/000_baseline_signature_tables.sql` after idempotency verification in Supabase SQL Editor.

### Full SQL (inline for reviewer convenience)

```sql
-- Baseline captured 2026-05-16 via introspection of project lvaqqqyjqtguozmdjmfn.
-- Idempotent — apply before any Phase 2 remediation. Mirrors live schema exactly,
-- including the redundant idx_tokens_token index (dropped in Phase 2 finding E).
-- ENABLE ROW LEVEL SECURITY here records the US-023.5 outcome so a fresh project
-- starts in the secured state.

-- ----------------------------------------------------------------------------
-- signature_tokens — single-use signing tokens, one per stage per RFQ
-- ----------------------------------------------------------------------------
create table if not exists public.signature_tokens (
  id              uuid primary key default gen_random_uuid(),
  rfq_id          uuid not null,
  token           varchar not null,
  client_email    varchar not null,
  client_name     varchar,
  expires_at      timestamptz not null,
  used_at         timestamptz,
  is_valid        boolean default true,
  created_at      timestamptz default now(),
  signature_stage text default 'manager',
  constraint signature_tokens_token_key unique (token)
);

create index if not exists idx_tokens_rfq   on public.signature_tokens (rfq_id);
create index if not exists idx_tokens_token on public.signature_tokens (token);
-- ^ idx_tokens_token is redundant with signature_tokens_token_key (UNIQUE creates
--   its own unique btree). Captured here because it exists live; dropped by
--   Phase 2 finding E.

alter table public.signature_tokens enable row level security;
-- ^ Records the US-023.5 RLS lockdown (commit 67d22fc, 2026-05-15). No policies
--   attached — service role bypasses RLS; anon is blocked from SELECT.

-- ----------------------------------------------------------------------------
-- quote_signatures — completed signature records
-- ----------------------------------------------------------------------------
create table if not exists public.quote_signatures (
  id                uuid primary key default gen_random_uuid(),
  rfq_id            uuid,
  quote_number      varchar,
  signer_name       varchar not null,
  signer_email      varchar not null,
  signer_title      varchar,
  signer_company    varchar,
  signature_data    text,
  signature_type    varchar default 'click',
  signed_at         timestamptz default now(),
  ip_address        varchar,
  user_agent        text,
  quote_total       numeric,
  quote_description text,
  status            varchar default 'SIGNED',
  created_at        timestamptz default now(),
  signature_stage   varchar default 'client'
);

create index if not exists idx_signatures_rfq   on public.quote_signatures (rfq_id);
create index if not exists idx_signatures_quote on public.quote_signatures (quote_number);

alter table public.quote_signatures enable row level security;
-- ^ RLS was already on at audit time (correctly locked down at table creation).
--   Existing 4 policies (with 2 duplicate pairs) are NOT captured in this
--   baseline — they ship as their own dedup migration when US-023.5 follow-up #1
--   is picked up. Baseline records the table being in the RLS-enabled state.
```

### Indexes captured (5 total)

| # | Table              | Index                          | Notes                                                       |
|---|--------------------|--------------------------------|-------------------------------------------------------------|
| 1 | signature_tokens   | `signature_tokens_pkey`        | PK on `id` (implicit unique btree)                          |
| 2 | signature_tokens   | `signature_tokens_token_key`   | UNIQUE on `token` (implicit unique btree)                   |
| 3 | signature_tokens   | `idx_tokens_rfq`               | btree on `rfq_id` — used by `/api/sign-tokens-list` queries |
| 4 | signature_tokens   | `idx_tokens_token`             | btree on `token` — **redundant**, dropped by Phase 2.E      |
| 5 | quote_signatures   | `quote_signatures_pkey`        | PK on `id` (implicit unique btree)                          |
| 6 | quote_signatures   | `idx_signatures_rfq`           | btree on `rfq_id`                                           |
| 7 | quote_signatures   | `idx_signatures_quote`         | btree on `quote_number`                                     |

(5 user-created indexes plus the two primary-key indexes.)

---

## Phase 2 — Remediation plan (no files created yet)

Findings A–G grouped by severity. Each one drafted here as inline SQL with its target migration filename. Files are **not** created until each tier is actually applied, so each migration can be revised against the data state at the time it runs.

### HIGH — must land before US-024 ships

US-024 introduces real recipient routing, which means more `signature_tokens` rows from new senders and more `quote_signatures` rows from new signers. All findings below get worse the more rows accumulate; fix them before US-024 starts writing into the tables.

Phase 2 HIGH ships as a **single combined migration file** rather than the per-finding files originally planned. Rationale: the pre-checks run 2026-05-16 showed the dataset is dev-sized (1 RFQ, 1 token, 2 quote_signatures rows — both audit-confirmed test junk). With the orphan rows deleted, all three findings (A, partial B, G) can land atomically with no inter-step risk, and the single file is easier to review and roll back than three.

**Target file:** `supabase/migrations/001_signature_tables_phase2_high.sql`

**Scope:**

1. `DELETE` 2 audit-confirmed orphan test rows from `quote_signatures` by explicit id (`c3a66453-27f0-477b-8cf4-65098697fc4b` and `1f8d1eb7-c47f-4eb4-ab86-ce0f45519e30`). Pre-delete row content is captured inline as a comment block so the deleted data is recoverable from version control.
2. **Finding A — FKs on `rfq_id`.** Add `signature_tokens_rfq_fk` and `quote_signatures_rfq_fk` referencing `rfqs.id` with `ON DELETE RESTRICT`. ON DELETE semantics decided 2026-05-16 — RESTRICT not CASCADE, per [ADR-006 FK Activation & Delete-Semantics Amendment](./ADR-006-e-sign-built-in-two-stage.md#fk-activation--delete-semantics-amendment-2026-05-16). Rationale: signature evidence must not be silently cascade-deleted with its parent RFQ.
3. **Finding G — `NOT NULL` on `quote_signatures.rfq_id`.** Bundled into Phase 2 HIGH (originally planned for MEDIUM tier) because the table is empty after Step 1, so the constraint applies for free.
4. **Finding B (partial) — `signature_token_id` column + FK.** Add `quote_signatures.signature_token_id uuid` as a **NULLABLE** column, plus `quote_signatures_token_fk` referencing `signature_tokens.id` with `ON DELETE RESTRICT`. No heuristic backfill — pre-check B3 confirmed all historical rows are unmatchable and are deleted as junk in Step 1.
5. **Finding B (NOT NULL) deferred to US-024.** The `NOT NULL` tightening on `signature_token_id` requires `api/sign-submit.js` to populate the column on the `quote_signatures` INSERT. Schema and code change together in US-024's PR. The exact location of that INSERT must be re-verified at US-024 implementation time — line numbers in `api/sign-submit.js` have drifted before, including during the US-023.5 server-side refactor.

**Risk:** Low. The transaction is wrapped in `BEGIN`/`COMMIT`. Three independent `do $$ ... raise exception` guards (DELETE count check, orphan re-check, FK validation against now-empty table) ensure that any unexpected data state aborts and rolls back the whole migration. The migration is **one-shot, not idempotent** — accidental re-run aborts at the DELETE count guard.

**Companion changes that must land in the same commit:**

- [ADR-006 FK Activation & Delete-Semantics Amendment](./ADR-006-e-sign-built-in-two-stage.md#fk-activation--delete-semantics-amendment-2026-05-16) — records the RESTRICT decision and the activation of `signature_token_id` FK that the ADR-006 Reconciliation Note had deferred.
- This plan-doc update — supersedes the original two-file CASCADE plan with the single-file RESTRICT plan now adopted.

### MEDIUM — fix before public launch

#### C — CHECK constraint + NOT NULL on `signature_stage` (both tables)

**Target file:** `supabase/migrations/003_signature_stage_check.sql`

**Risk:** Low if no null `signature_stage` rows exist. Pre-check fails loudly if backfill is needed.

```sql
-- Phase 2.C — Enforce signature_stage values + NOT NULL.
do $$
declare null_tokens int; null_sigs int;
begin
  select count(*) into null_tokens from public.signature_tokens where signature_stage is null;
  select count(*) into null_sigs   from public.quote_signatures where signature_stage is null;
  if null_tokens > 0 or null_sigs > 0 then
    raise exception 'signature_stage backfill required: % null in signature_tokens, % null in quote_signatures', null_tokens, null_sigs;
  end if;
end $$;

alter table public.signature_tokens
  add constraint signature_tokens_stage_chk check (signature_stage in ('manager','client')),
  alter column signature_stage set not null;

alter table public.quote_signatures
  add constraint quote_signatures_stage_chk check (signature_stage in ('manager','client')),
  alter column signature_stage set not null;
```

#### G — NOT NULL on `quote_signatures.rfq_id`

**Target file:** `supabase/migrations/004_quote_signatures_rfq_not_null.sql`

**Risk:** Low if no orphan signatures exist. Pre-check fails loudly so the operator can either `DELETE` (junk rows) or `UPDATE` (attach to correct RFQ) before re-running. Note: must run *after* Phase 2.A so the FK is already present.

```sql
-- Phase 2.G — NOT NULL on quote_signatures.rfq_id.
-- Apply AFTER 2.A (FK constraint already in place).
do $$
declare orphan_sigs int;
begin
  select count(*) into orphan_sigs from public.quote_signatures where rfq_id is null;
  if orphan_sigs > 0 then
    raise exception 'quote_signatures.rfq_id backfill required: % orphan rows', orphan_sigs;
  end if;
end $$;

alter table public.quote_signatures
  alter column rfq_id set not null;
```

### LOW — opportunistic, tidy with next routine migration

#### D — Type harmonisation: `signature_stage` to `text` on both tables

**Target file:** `supabase/migrations/005_signature_stage_type.sql`

**Risk:** Low. PostgreSQL treats `varchar` and `text` as effectively the same; the change is for consistency and to satisfy future type-generation tooling.

```sql
-- Phase 2.D — Normalise signature_stage type to text on quote_signatures
-- (signature_tokens is already text). Default re-attached after the type swap.
alter table public.quote_signatures
  alter column signature_stage drop default,
  alter column signature_stage type text using signature_stage::text,
  alter column signature_stage set default 'client';
```

#### E — `DROP INDEX idx_tokens_token`

**Target file:** `supabase/migrations/006_drop_redundant_idx_tokens_token.sql`

**Risk:** None. The `UNIQUE (token)` constraint already provides an equivalent unique btree (`signature_tokens_token_key`).

```sql
-- Phase 2.E — Drop redundant idx_tokens_token. UNIQUE(token) already provides
-- an equivalent btree index via signature_tokens_token_key.
drop index if exists public.idx_tokens_token;
```

#### F — No action

Flag-only. Revisit when US-025–028 introduces per-signer audit views; an index on `signature_tokens(client_email)` and/or `quote_signatures(signer_email)` may be warranted then.

---

## Phase 3 — Execution sequencing

| Order | Action                                                                                  | Gating event                                                  |
| ----- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 1     | Apply `000_baseline_signature_tables.sql` to live DB via SQL Editor to verify idempotency | Now — pending Len's go-ahead before file lands in repo        |
| 2     | Land the SQL file in `supabase/migrations/` (separate commit from this doc)             | Step 1 confirms no-op against live DB                         |
| 3     | Run pre-check counts for HIGH-tier (orphan rfq_id, unlinked signatures)                 | Before authoring 001 / 002                                    |
| 4     | Apply HIGH-tier (A + B-partial + G) — single file `001_signature_tables_phase2_high.sql`, ON DELETE RESTRICT, signature_token_id NOT NULL deferred to US-024 | **Before US-024 starts writing into the tables** |
| 4a    | Author US-024 to land `signature_token_id` NOT NULL + the `api/sign-submit.js` code change populating the column in the same commit/PR | Immediately after step 4 commits cleanly |
| 5     | Apply MEDIUM-tier (C only — G landed early in row 4) — author 003                       | Before public launch                                          |
| 6     | Apply LOW-tier (D, E) — author 005 + 006                                                | Opportunistic — bundle with the next unrelated migration      |
| 7     | Cut tag `phase1-us023-schema-migration-verified` after all of 001–006 are applied       | After step 6                                                  |

---

## Commit strategy for this story

1. **Commit this doc alone first** as `docs: US-023 schema migration plan`. No SQL file lands in this commit — the doc enumerates the plan and inlines the SQL for review.
2. **Then ask before creating `supabase/migrations/000_baseline_signature_tables.sql`.** Len may want to apply the baseline SQL to the live Supabase project via SQL Editor first to confirm true idempotency (i.e. `CREATE TABLE IF NOT EXISTS` + `CREATE INDEX IF NOT EXISTS` + `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` all return without error or behavioural change against the existing schema). Only after that smoke does the file land in repo as a separate commit.

This separation keeps the planning artefact reviewable as text and the source-of-truth SQL file a deliberate, verified hand-off.

### Phase 2 HIGH commit strategy (revised 2026-05-16)

Phase 2 HIGH lands as **one atomic commit** containing:

1. `supabase/migrations/001_signature_tables_phase2_high.sql` — the migration file (not yet applied to the live DB).
2. `decisions/ADR-006-e-sign-built-in-two-stage.md` — the FK Activation & Delete-Semantics Amendment appended.
3. `decisions/US-023-schema-migration.md` — this plan doc updated to match (Phase 2 HIGH section, Phase 3 sequencing rows 4–5, this Commit Strategy section, Status Log).

Rationale for atomic-commit (departure from Phase 1's split-commit pattern): the three artefacts encode a single coordinated decision. Splitting them across commits would create review states where (a) the migration references an amendment that doesn't exist yet, or (b) the plan doc describes a strategy contradicted by the in-tree ADR. Atomic commit avoids both inconsistencies.

After the commit lands, the migration is **applied separately** via the Supabase SQL Editor (same discipline as Phase 1 baseline). Apply success is recorded in the Status Log section below.

---

## Out of scope

- `quote_signatures` duplicate RLS policy cleanup (US-023.5 follow-up #1) — own migration when picked up.
- Legacy Supabase JWT API key migration to `sb_secret_xxx` format (US-023.5 follow-up #7) — unrelated.
- Index on `client_email` / `signer_email` (finding F) — revisit at US-025–028.

---

## Status log

- **2026-05-16** — Phase 1 baseline applied. Idempotency verified in Supabase SQL Editor before commit, file at `supabase/migrations/000_baseline_signature_tables.sql`. Phase 2 and 3 remain open.
- **2026-05-16** — Phase 2 HIGH pre-checks run against live DB (project `lvaqqqyjqtguozmdjmfn`). 10-row consolidated SELECT executed via SQL Editor. Findings: A1=0, A2=2, A3=0, B1=2, B2=0, B3=2, B4=0. Heuristic gate `B2 + B3 = B1` held. The 2 orphan `quote_signatures` rows were audit-confirmed as dev test artefacts (signer "Test Customer", quote_number Q001, signed 2026-05-10). DELETE-then-constrain path approved; CASCADE→RESTRICT decision recorded in ADR-006 amendment of the same date.
- **2026-05-16** — Phase 2 HIGH migration `supabase/migrations/001_signature_tables_phase2_high.sql` authored (not yet applied). Single combined file replaces the two-file plan originally drafted under Phase 2 HIGH; all three FKs use `ON DELETE RESTRICT`. Migration awaits Len's review and approval to apply via Supabase SQL Editor.
