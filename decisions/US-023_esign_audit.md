# US-023 — E-Sign Module Baseline Audit

| Field   | Value                                                                                          |
| ------- | ---------------------------------------------------------------------------------------------- |
| Date    | 2026-05-14 (inferred — audit preceded US-023.5 RLS lockdown commit `67d22fc` on 2026-05-15)    |
| Status  | **Audit complete — security finding spawned [US-023.5](./US-023.5-paused-supabase-js-mystery.md)** |
| Author  | Len Klopper / PUSH AI                                                                          |
| Related ADR | [ADR-006 — E-Sign Built-in Two-Stage](./ADR-006-e-sign-built-in-two-stage.md)              |

---

## Scope

Post-rebuild audit of the e-sign module infrastructure — schema state, code archaeology of the signing surface, and a defensive review of access control on the two e-sign tables. The audit was triggered by the rebuild having left the e-sign module in an unverified state (US-012 / US-013 had shipped, but the post-rebuild reverification was deferred under time pressure).

The audit is the upstream parent of:
- **US-023.5** (RLS lockdown on `signature_tokens`) — closed at tag `phase1-us023-5-rls-lockdown-verified` (`8800e9b`).
- US-024 (real recipient routing — Dewald/Jaco fallback).
- US-025–028 (remainder of the E-Sign module per [ADR-006](./ADR-006-e-sign-built-in-two-stage.md)).

---

## Schema introspection state

Both e-sign tables exist in the live Supabase project (`lvaqqqyjqtguozmdjmfn`):

- **`signature_tokens`** — single-use signing tokens, one per stage per RFQ. Stage discriminator column `signature_stage` carries `'manager'` (Stage 1) or `'client'` (Stage 2). Columns observed at audit time: `id`, `rfq_id`, `token`, `client_email`, `client_name`, `expires_at`, `used_at`, `is_valid`, `created_at`, `signature_stage`.
- **`quote_signatures`** — completed signature records, also keyed by stage. Joined back to `signature_tokens` via `signature_token_id` (FK).

**No migration files exist for either table.** Schema is not version-controlled — the tables were created by hand during the e-sign v1 build window (May 2026). This is a structural follow-up: **schema migration files for the LIVE schema** still need to be captured. Only introspection query 4a (RLS check) was run during this audit; queries 1, 2, 3 (full column / constraint / index listing) were deferred.

---

## Code archaeology — signing surface

Entry point — the React app short-circuits the main shell when the URL matches the `/sign/:token` pattern, bypassing `RoleSelector` and the kanban layout since signers arrive from an email link with no app session:

- **`src/App.tsx:640`** — `isSignRoute = window.location.pathname.startsWith('/sign/')` gates the short-circuit. (The signing route handler itself renders `<SignaturePage />` instead of the main board UI.)

Page component:

- **`src/components/SignaturePage.tsx`** — single page for both stages. Stage 1 (`'manager'`) renders the full sign-off interface; Stage 2 (`'client'`) is checkpoint-pending and renders a placeholder so a Stage 2 token clicked during smoke testing surfaces gracefully without exposing a half-built customer flow. Token validation is performed by calling `/api/sign-validate` (POST), then the page reads the parent RFQ row directly via the anon-keyed `supabase` client (`src/components/SignaturePage.tsx:71-72`) — privileged-data follow-up; see Follow-ups #5.

Stage token discriminator:

- **`signature_stage`** column on `signature_tokens` — values `'manager'` or `'client'`. The same column on `quote_signatures` records which stage produced each signature.

Stage 1 → Stage 2 cascade (server-side):

- **`api/sign-submit.js:198`** — Stage 1 cascade insert. On successful manager signature, the route flips RFQ status `QUOTED → SENT_TO_CUSTOMER`, generates a fresh Stage 2 token via `crypto.randomUUID()` (line 189), inserts a `signature_stage = 'client'` row into `signature_tokens`, and dispatches the customer review-and-sign email. Stage 2 ('client') signatures return 501 from this route until US-013 work resumes — the audit confirmed the Stage 1 checkpoint isn't accidentally crossed.

Token generation:

- At audit time, `crypto.randomUUID()` was being called **inline in App.tsx** (around line 938, inside the manager-approval handler). The US-023.5 refactor moved this server-side: it now lives at `api/manager-approval-send.js:35` (Stage 1 token) and `api/sign-submit.js:189` (Stage 2 token).

### 6 `signature_tokens` operation sites at audit time

| # | Site (audit baseline) | Op | Post-US-023.5 location |
|---|---|---|---|
| 1 | `App.tsx:921` | list / fetch | Client now calls `/api/sign-tokens-list` (server-side select at `api/sign-tokens-list.js:19`) |
| 2 | `App.tsx:940` | INSERT (manager token) | Moved server-side to `api/manager-approval-send.js:38` |
| 3 | `SignaturePage.tsx:67` | SELECT (token validate) | Moved server-side via `/api/sign-validate` (`api/sign-validate.js:24`) |
| 4 | `api/sign-submit.js:127` | SELECT (token lookup) | Unchanged |
| 5 | `api/sign-submit.js:179` | UPDATE (mark used) | Unchanged |
| 6 | `api/sign-submit.js:198` | INSERT (Stage 2 token) | Unchanged |

Sites 1–3 were the audit's principal security concern — privileged operations being executed with the anon key from client-side code. The US-023.5 refactor moved all three to service-role-keyed server routes, then enabled RLS on the table.

---

## Critical security finding

`signature_tokens.rowsecurity = false` (introspection query 4a). With RLS disabled and the anon role granted SELECT on the table by default, **any unauthenticated visitor could enumerate the full set of valid signing tokens via PostgREST** (`GET /rest/v1/signature_tokens`) and use them to land directly on `/sign/<token>` pages, bypassing the email-link delivery channel. Tokens are single-use and expire in 7 days, but the window of exposure for any unsigned-yet-valid token was unconstrained.

`quote_signatures.rowsecurity = true` (correctly locked down at table creation), so the completed-signature audit trail was not similarly exposed.

This finding spawned **US-023.5** as a separate story, since the fix required a coordinated refactor (move three client-side operations to server routes + enable RLS in a single deploy to avoid breaking the signing flow). US-023.5 closed at `phase1-us023-5-rls-lockdown-verified` (`8800e9b`) on 2026-05-16.

### Secondary finding (low severity, deferred)

`quote_signatures` carries **4 RLS policies with 2 duplicate pairs** — historical artefact of incremental policy edits during the e-sign v1 build. `DROP POLICY` cleanup is the trivial fix. Deferred because the duplicate policies were over-permissive only in the sense of redundancy, not in granting unintended access. Logged as US-023.5 follow-up #1.

---

## Forward links

- **US-023.5** — RLS lockdown on `signature_tokens`. Closed 2026-05-16 at tag `phase1-us023-5-rls-lockdown-verified` (`8800e9b`). See [decisions/US-023.5-paused-supabase-js-mystery.md](./US-023.5-paused-supabase-js-mystery.md) for the pause-and-resume detail.
- **US-024** — Real recipient routing for `api/manager-approval-send.js`. Currently hardcoded to Hendrik; needs routing by RFQ's assigned quoter with Dewald / Jaco fallback per [ADR-006](./ADR-006-e-sign-built-in-two-stage.md) v2.
- **US-025 – US-028** — Remainder of the E-Sign module per [ADR-006](./ADR-006-e-sign-built-in-two-stage.md): Stage 2 implementation lift-out from checkpoint-pending, signature audit-log surfacing, signer identity hardening, and DocuSign-deferred reversal path documentation.

---

## Outstanding within US-023 scope

The audit completed the security finding (query 4a, RLS state). Queries 1, 2, 3 (columns, constraints, indexes) ran on **2026-05-16** — results captured in the Schema Introspection Addendum below. Version-controlled migration files for both tables remain to be authored as **US-023-schema-migration** (separate story) so the live schema is reproducible from source — otherwise US-024 inherits the same drift risk.

---

## Schema Introspection Addendum (2026-05-16)

Queries 1, 2, 3 run against the live Supabase project (`lvaqqqyjqtguozmdjmfn`). Captured verbatim below; findings called out after.

### Query 1 — Columns

**`signature_tokens`**

| column           | type                          | nullable | default              |
| ---------------- | ----------------------------- | -------- | -------------------- |
| id               | uuid                          | NO       | `gen_random_uuid()`  |
| rfq_id           | uuid                          | NO       | —                    |
| token            | character varying             | NO       | —                    |
| client_email     | character varying             | NO       | —                    |
| client_name      | character varying             | YES      | —                    |
| expires_at       | timestamp with time zone      | NO       | —                    |
| used_at          | timestamp with time zone      | YES      | —                    |
| is_valid         | boolean                       | YES      | `true`               |
| created_at       | timestamp with time zone      | YES      | `now()`              |
| signature_stage  | text                          | YES      | `'manager'`          |

**`quote_signatures`**

| column            | type                          | nullable | default               |
| ----------------- | ----------------------------- | -------- | --------------------- |
| id                | uuid                          | NO       | `gen_random_uuid()`   |
| rfq_id            | uuid                          | YES      | —                     |
| quote_number      | character varying             | YES      | —                     |
| signer_name       | character varying             | NO       | —                     |
| signer_email      | character varying             | NO       | —                     |
| signer_title      | character varying             | YES      | —                     |
| signer_company    | character varying             | YES      | —                     |
| signature_data    | text                          | YES      | —                     |
| signature_type    | character varying             | YES      | `'click'`             |
| signed_at         | timestamp with time zone      | YES      | `now()`               |
| ip_address        | character varying             | YES      | —                     |
| user_agent        | text                          | YES      | —                     |
| quote_total       | numeric                       | YES      | —                     |
| quote_description | text                          | YES      | —                     |
| status            | character varying             | YES      | `'SIGNED'`            |
| created_at        | timestamp with time zone      | YES      | `now()`               |
| signature_stage   | character varying             | YES      | `'client'`            |

### Query 2 — Constraints

| table             | constraint                   | type        | definition         |
| ----------------- | ---------------------------- | ----------- | ------------------ |
| signature_tokens  | `signature_tokens_pkey`      | PRIMARY KEY | `(id)`             |
| signature_tokens  | `signature_tokens_token_key` | UNIQUE      | `(token)`          |
| quote_signatures  | `quote_signatures_pkey`      | PRIMARY KEY | `(id)`             |

No FOREIGN KEY constraints. No CHECK constraints. No additional UNIQUE constraints.

### Query 3 — Indexes

| table             | index                          | definition                                         |
| ----------------- | ------------------------------ | -------------------------------------------------- |
| signature_tokens  | `signature_tokens_pkey`        | UNIQUE btree `(id)`                                |
| signature_tokens  | `signature_tokens_token_key`   | UNIQUE btree `(token)`                             |
| signature_tokens  | `idx_tokens_rfq`               | btree `(rfq_id)`                                   |
| signature_tokens  | `idx_tokens_token`             | btree `(token)` *(redundant — covered by UNIQUE)*  |
| quote_signatures  | `quote_signatures_pkey`        | UNIQUE btree `(id)`                                |
| quote_signatures  | `idx_signatures_rfq`           | btree `(rfq_id)`                                   |
| quote_signatures  | `idx_signatures_quote`         | btree `(quote_number)`                             |

### Findings revealed by Queries 1–3

These are deferred follow-ups under US-023, distinct from US-023.5's existing follow-up list. To be carried into the US-023-schema-migration story:

**A. No FK from `signature_tokens.rfq_id` or `quote_signatures.rfq_id` to `rfqs.id`.** Both `rfq_id` columns reference rfqs by convention only. Cascading delete of an RFQ leaves orphan token/signature rows. `quote_signatures.rfq_id` is additionally nullable — a completed signature with no parent RFQ is currently a legal row.

**B. No FK between `quote_signatures` and `signature_tokens`.** ADR-006's data model says these tables are linked via `signature_token_id` on `quote_signatures`, but the column does not exist. The audit trail between a token and the signature it produced is implicit (join on `rfq_id` + `signature_stage`), not deterministically enforceable. If two manager signatures were ever recorded for the same RFQ, there is no way to tell which token each one used.

**C. `signature_stage` has no CHECK constraint and is nullable in both tables.** Valid values (`'manager'`, `'client'`) are enforced only in `api/sign-submit.js:136-138` (validation guard) and the column defaults. A direct INSERT bypassing the route can store any string. Recommendation: `CHECK (signature_stage IN ('manager','client'))` + `NOT NULL`, with a backfill of any nulls before applying.

**D. Type inconsistency for `signature_stage`.** `signature_tokens.signature_stage` is `text`; `quote_signatures.signature_stage` is `character varying`. Functionally equivalent in PostgreSQL but a noise source for any future ORM / type-generation tooling. Normalise to one type (recommend `text`).

**E. Redundant index `idx_tokens_token`.** The `UNIQUE` constraint on `signature_tokens(token)` already creates a unique btree index (`signature_tokens_token_key`). The separate `idx_tokens_token` btree on the same column is a duplicate — safe to `DROP INDEX`.

**F. No index on `signature_tokens(client_email)` or `quote_signatures(signer_email)`.** Currently no query path uses email as a primary lookup, so not yet a problem; flag if a per-signer audit view is added under US-025–028.

**G. Missing NOT NULL on `quote_signatures.rfq_id`.** Combined with finding A, this is the path to orphan signature rows. Backfill check + `ALTER COLUMN ... SET NOT NULL` once any existing nulls are reconciled.
