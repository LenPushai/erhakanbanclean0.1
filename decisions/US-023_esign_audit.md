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

The audit completed the security finding (queryroom 4a, RLS state) but **three of the four planned schema introspection queries were not run** — only 4a (RLS check) was executed. The remaining queries:

1. **Query 1** — Full column list with types and nullability for `signature_tokens` and `quote_signatures`.
2. **Query 2** — Constraint listing (PK, FK, UNIQUE, CHECK) for both tables.
3. **Query 3** — Index listing for both tables.

These should be run and captured either as an **addendum to this audit doc** or as a **separate US-023-schema-migration story** that produces version-controlled migration files for both tables. Doing this before US-024 closes the "schema not version controlled" gap noted under Schema Introspection State above — otherwise US-024 inherits the same drift risk.
