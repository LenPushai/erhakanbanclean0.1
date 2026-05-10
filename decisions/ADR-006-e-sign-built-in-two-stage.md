# ADR-006: E-Signature — Built-in Two-Stage Workflow Over Third-Party (DocuSign Deferred)

| Field   | Value                                                                                          |
| ------- | ---------------------------------------------------------------------------------------------- |
| Date    | 2026-05-08                                                                                     |
| Status  | **Inferred — Awaiting Confirmation**                                                           |
| Author  | Len Klopper / PUSH AI                                                                          |
| User Story | US-012 (Stage 1, internal manager), US-013 (Stage 2, external customer)                    |
| Implementation Tag | TBD (target build window: 8–9 May 2026, before Monday user go-live)               |

---

## Context

The ERHA Phase 1 RFQ workflow includes a two-stage e-signature step:

- **Stage 1 — Internal:** an authorised manager (Hendrik or Dewald) digitally signs the quote PDF after internal approval, flipping the quote status to `APPROVED_INTERNAL`.
- **Stage 2 — External:** the customer receives the signed quote, reviews it in a browser, and signs to accept, flipping the quote status to `ACCEPTED` and triggering the ORDER WON email cascade.

The original specification (Q4 2025 / Q1 2026) targeted **DocuSign API integration** for both stages. A DocuSign integration was attempted and abandoned for two reasons captured during the build:

1. **Cost** — per-envelope and per-user pricing is material at ERHA's expected volume; for a SME at this stage, it's a recurring overhead the project cannot justify.
2. **Build complexity** — the integration footprint (auth, envelope creation, callback webhooks, status reconciliation) consumed more time than budgeted with no proportional value over the alternatives.

A **Built-in E-Sign** approach was designed in earlier sessions (confirmed by Len on 3 February 2026 with the explicit choice of *"E-Sign"*) and preserved through subsequent project memory. This ADR formalises that decision, captures the design, and explicitly defers DocuSign as the third-party path that is no longer the chosen direction.

Phase 1 cannot ship to Monday without resolving the e-signature mechanism. Built-in E-Sign is the path forward; this ADR is the spec.

---

## Decision

Build a **Built-in E-Signature** feature inside the ERHA application, replacing the DocuSign integration entirely. Two-stage flow as designed:

### Stage 1 — Internal Manager Signature

1. When quote status moves to `READY_FOR_APPROVAL`, send email to the manager (Hendrik or Dewald per assignment) containing a **review-and-sign link** with a single-use token.
2. Link opens the quote PDF in the browser inside ERHA, with a signature capture interface below.
3. Manager either **draws a signature** on a canvas element OR clicks **"I Approve"** (both produce a recorded signature record).
4. System captures: signer name, IP address, timestamp, signature image (if drawn), and a unique signature ID.
5. Quote status flips to `APPROVED_INTERNAL`.
6. Stage 2 triggers automatically — email sends to the external customer.

### Stage 2 — External Customer Signature

1. Customer receives email with a **review-and-sign link** containing a single-use token (different from Stage 1's token).
2. Link opens the quote in the browser — no login required, token-authenticated.
3. Customer reviews the quote PDF, then either draws a signature or clicks **"I Accept"**.
4. System captures: customer name, IP address, timestamp, signature image, signature ID.
5. Quote status flips to `ACCEPTED`.
6. Triggers the **ORDER WON** email cascade to the team (Jeanic, Wessie, the team).

### Data Model

Two Supabase tables (already designed in earlier sessions):

- **`signature_tokens`** — `id`, `quote_id`, `stage` (1 or 2), `token` (UUID), `expires_at`, `used_at`, `recipient_email`
- **`quote_signatures`** — `id`, `quote_id`, `stage`, `signer_name`, `signer_email`, `signer_ip`, `signature_image` (base64 or storage URL), `signed_at`, `signature_token_id` (FK)

Both tables write to `activity_log` on each signature event for audit-trail consistency with the rest of the system.

### Token Security

- Tokens are UUIDs, single-use, and expire after **7 days** by default.
- Once `used_at` is set, the token cannot be reused.
- Stage 1 token is generated when quote moves to `READY_FOR_APPROVAL`.
- Stage 2 token is generated when Stage 1 completes successfully.

### Legal Validity

The signature mechanism is legally valid under **South Africa's Electronic Communications and Transactions (ECT) Act, 2002**, which recognises advanced electronic signatures with intent to be bound, identifying the signatory, and being uniquely linked to the signed data. Capturing IP, timestamp, name, and the signature image meets these requirements for ordinary commercial transactions of the type ERHA handles.

A small legal disclaimer appears on the signature interface for both stages: *"By signing or clicking 'I Accept', you acknowledge that this signature is legally binding under the Electronic Communications and Transactions Act 25 of 2002."*

---

## Reasoning

**1. Cost.** Built-in E-Sign has zero ongoing cost. DocuSign at ERHA's expected volume would carry a meaningful monthly fee. Cost compounds; the savings are real for a SME.

**2. UX control.** The signature interface lives inside ERHA's design language. The customer-facing experience is "click link → see your quote → sign" — no DocuSign branding, no third-party redirects, no account creation friction.

**3. Build simplicity.** Two Supabase tables, two email templates, a signature canvas component, a token-validating route. No third-party API, no webhooks, no envelope state reconciliation. Fits inside a Friday afternoon's work for v1.

**4. Audit trail consistency.** Signature events flow into the same `activity_log` as every other state change, queryable in the same tools. With DocuSign, the signature record lives outside ERHA's database and requires API calls to query.

**5. Legal sufficiency for ERHA's use case.** ECT Act compliance is straightforward at this signature complexity tier. ERHA's transactions don't require advanced electronic signatures (which need accredited certification authorities) — ordinary electronic signatures with the captured metadata are legally adequate.

**6. Reversibility.** If ERHA grows to a scale or sector where DocuSign becomes preferable, migration is straightforward — the quote data and signature audit trail remain valid records of past signatures, and DocuSign integration can be added as the new path forward without invalidating historical signatures.

---

## Risk if Wrong

**Customer rejects the signature mechanism's legal weight.** Mitigation: ECT Act compliance with documented metadata capture; legal disclaimer on signature interface; if a customer specifically requires DocuSign, that becomes a per-customer override conversation rather than a wholesale system change.

**Token leakage exposes a quote to unauthorised parties.** Mitigation: 7-day TTL; single-use enforcement; tokens are UUIDs (effectively unguessable); access is read-and-sign only — there's no destructive action a leaked token enables beyond what the customer was supposed to do anyway.

**Customer doesn't sign within the TTL.** v1 mitigation: Jeanic re-issues a fresh token manually. v2 enhancement (post-Monday): automated reminder emails at day 3 and day 6 if not signed.

**Signature interface broken on customer's browser.** Mitigation: standard responsive design; fallback to "I Accept" button if canvas signature isn't supported on the device; smoke test on phone, tablet, desktop before Monday.

---

## Reversal Plan

If Built-in E-Sign needs to be replaced with DocuSign (or another third-party) in future:

1. Author successor ADR documenting the third-party choice.
2. Add the third-party integration as a parallel signature path.
3. Migrate new quotes to the new path; existing signed quotes remain valid via their `quote_signatures` records.
4. Mark this ADR as **Superseded by ADR-NNN** with a note about the trigger.
5. Estimated effort to add DocuSign as a parallel path: 2–3 dev days, but only if/when triggered.

---

## Open Questions for Client Confirmation

1. **7-day token TTL** — acceptable, or should it be shorter (24 hours) or longer (14 days)?
2. **Signature method preference** — both *draw-on-screen* and *click "I Accept"* offered, or just one? Some clients may prefer the simplicity of a click-only flow.
3. **Reminder cadence (Phase 2 enhancement)** — should the system send reminder emails to the customer at day 3 and day 6 if the quote remains unsigned? v1 does not include this; flagging for Phase 2.
4. **Stage 1 routing** — confirm Hendrik and Dewald as the two managers authorised to sign Stage 1; or does Jeanic also sign in some scenarios?

A "yes" to question 1 (or an alternative TTL), plus answers to 2, 3, and 4, moves this ADR's status from **Inferred** to **Confirmed**.

---

## Sequencing

**Hard prerequisites:**

- US-014 (`emailService.ts` cleanup verification) — must be clean before any new email triggers can land cleanly.
- US-011 (RBAC single-role) doesn't block this ADR's implementation but should ship around the same time so authenticated managers can access Stage 1.

**Build order:**

1. Author this ADR and commit (now).
2. US-012 (Stage 1) build — schema migration for two tables, Stage 1 email template, signature canvas component, token validation route, status transition logic.
3. US-013 (Stage 2) build — second email template, customer-facing signature route, ORDER WON cascade trigger.
4. Smoke test end-to-end: create a test quote, run through both stages, verify quote ends up `ACCEPTED` and ORDER WON emails fire.
5. Tag: `e-sign-v1-2026-05-08` (or whichever date the actual build lands).

---

## Audit Trail Reconciliation Note (2026-05-08)

**Discovery:** During the pre-build audit phase for US-012 + US-013, a Supabase schema probe revealed that **both `signature_tokens` and `quote_signatures` tables already exist in the live database** with a fully-formed column structure that **precedes this ADR**. The tables were created during earlier work — most likely the February 2026 e-sign design session — and were never populated. The audit found them empty (`status 200, body: []`) and structurally complete.

This means the original specification in this ADR's *Decision* section described tables that needed to be *created*, when in fact the data layer had already been built to a different design. Building against the original spec would have either failed (table-creation conflicts) or required a destructive migration of existing structure. The audit-first discipline caught this before any code landed — the catch is the system working as designed.

**The reconciliation decision: adapt this ADR to the existing schema. Do not drop and recreate.**

### Live schema (ground truth, captured via Supabase information_schema query 2026-05-08)

**`signature_tokens` (10 columns):**

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | `gen_random_uuid()` |
| `rfq_id` | uuid | NO | — |
| `token` | varchar | NO | — |
| `client_email` | varchar | NO | — |
| `client_name` | varchar | YES | — |
| `expires_at` | timestamptz | NO | — *(caller-set, not auto-defaulted)* |
| `used_at` | timestamptz | YES | — |
| `is_valid` | boolean | YES | `true` |
| `created_at` | timestamptz | YES | `now()` |
| `signature_stage` | text | YES | `'manager'` |

**`quote_signatures` (17 columns):**

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | `gen_random_uuid()` |
| `rfq_id` | uuid | YES | — |
| `quote_number` | varchar | YES | — |
| `signer_name` | varchar | NO | — |
| `signer_email` | varchar | NO | — |
| `signer_title` | varchar | YES | — |
| `signer_company` | varchar | YES | — |
| `signature_data` | text | YES | — |
| `signature_type` | varchar | YES | `'click'` |
| `signed_at` | timestamptz | YES | `now()` |
| `ip_address` | varchar | YES | — |
| `user_agent` | text | YES | — |
| `quote_total` | numeric | YES | — |
| `quote_description` | text | YES | — |
| `status` | varchar | YES | `'SIGNED'` |
| `created_at` | timestamptz | YES | `now()` |
| `signature_stage` | varchar | YES | `'client'` |

### Reconciliation map — original ADR-006 spec → live schema

| Original ADR-006 spec | Live schema reality | Decision |
|----------------------|---------------------|----------|
| `signature_tokens.quote_id` (FK to quotes) | `signature_tokens.rfq_id` (links at RFQ level) | **Adapt to live.** RFQ-level linkage is consistent with broader ERHA data model where quotes live under RFQs. |
| `signature_tokens.stage` smallint (1 or 2) | `signature_tokens.signature_stage` text (`'manager'` / `'client'`) | **Adapt to live.** Readable string values are more legible in queries, logs, and admin tools than magic numbers. Decision against original spec. |
| `signature_tokens.recipient_email` | `signature_tokens.client_email` | **Adapt to live.** Naming difference; same purpose. |
| `signature_tokens` default `expires_at = now() + 7 days` | No default; caller sets `expires_at` explicitly | **Adapt to live.** Build code sets explicit 7-day expiry at token creation rather than relying on schema default. Same outcome. |
| `quote_signatures.quote_id` (FK) | `quote_signatures.rfq_id` (RFQ-level linkage) + denormalised `quote_number`, `quote_total`, `quote_description` | **Adapt to live, and the live schema is *better*.** Denormalised quote data captured at signing time is an immutable record of *what was actually signed* — strong for legal/audit purposes. Original ADR spec underspecified this. |
| `quote_signatures.stage` smallint | `quote_signatures.signature_stage` varchar | Same decision as on `signature_tokens` — adapt to live. |
| `quote_signatures.signer_ip` | `quote_signatures.ip_address` | **Adapt to live.** |
| `quote_signatures.signature_image` | `quote_signatures.signature_data` | **Adapt to live.** |
| `quote_signatures.signature_method` (drawn / clicked) | `quote_signatures.signature_type` (default `'click'`) | **Adapt to live.** Same purpose, different naming. |
| `quote_signatures.signature_token_id` FK | **Not present in live schema** | **Decided against.** Linkage is inferred via `rfq_id` + `signature_stage` (one token + one signature per RFQ per stage). Adding a strict FK is a Phase 2 enhancement if linkage proves ambiguous in practice. |

### Live schema columns the original ADR-006 did not anticipate (additive value)

The live schema includes columns the original spec missed, all of which add real value:

- **`signer_title`, `signer_company`** — additional signer metadata. Strengthens the audit record of *who signed in what capacity*.
- **`quote_total`, `quote_description`, `quote_number`** (denormalised on `quote_signatures`) — immutable record of what was signed at the moment of signing. Critical for legal defensibility if a quote is later modified or deleted.
- **`user_agent`** — browser/device info captured at signing. Useful for audit, fraud detection, and ML on signature behaviour.
- **`status`** (default `'SIGNED'` on `quote_signatures`) — signature lifecycle field. Allows for future states like `'REVOKED'` or `'CHALLENGED'` without schema changes.
- **`is_valid`** flag on `signature_tokens` — soft-invalidation capability. Lets us mark a token invalid without deleting the record.

The live schema is also **better aligned with the PUSH AI ML-first mandate** than the original spec. Fields like `user_agent`, `signature_type`, `signer_title`, `signer_company`, `quote_total`, and `is_valid` are all useful features for future ML on signature behaviour, fraud detection, and trust scoring. The original ADR-006 spec would have produced a leaner schema with fewer ML hooks.

### Build implications (revised from original *Sequencing* section)

1. **No DDL migration in v1.** Both tables exist; the build does not create them. The original spec's "schema migration creating two tables" step is removed.
2. **Optional ALTER TABLE deferred.** Adding a `signature_token_id` FK to `quote_signatures` is *not* in v1 — flagged as Phase 2 enhancement if RFQ + stage inference proves ambiguous in practice.
3. **PostgREST schema reload required only if columns change.** No reload needed for v1 since no DDL runs.
4. **All US-012 + US-013 build work shifts to email templates, signature route, signature capture component, status transitions, token validation, and the ORDER WON cascade trigger.** Data layer is in place.
5. **Build code must use live column names.** Every reference to `quote_id`, `recipient_email`, `signer_ip`, `signature_image`, `signature_method`, `stage` (as a number) in CC's build brief was wrong. Revised build brief must use `rfq_id`, `client_email`, `ip_address`, `signature_data`, `signature_type`, `signature_stage` (text values `'manager'` / `'client'`).
6. **Stage values in code:** `'manager'` for Stage 1 (internal), `'client'` for Stage 2 (external). Not `1` and `2`.
7. **The live schema's design choices (denormalisation, readable stage names, additive columns) are now canonical.** Future ADRs that touch e-sign should reference this Reconciliation Note as the authoritative schema description.

### What this means for the open questions in the original ADR

- **Q1 (7-day token TTL)** — still open; token TTL is set in build code at token creation, not in schema.
- **Q2 (signature method preference)** — partially answered by live schema. The default `signature_type` is `'click'`, suggesting click-to-accept is the established baseline; drawn signature is an alternative path the schema supports.
- **Q3 (reminder cadence)** — unchanged; still v2 enhancement.
- **Q4 (Stage 1 routing)** — unchanged; build-side decision.

### Standing forward

This Reconciliation Note is **forward-only** — the original Decision and Reasoning sections above are preserved as the historical record of how this ADR was originally written. They are NOT to be edited to retroactively match the live schema. The Note itself documents the gap between original intent and discovered reality, and the reconciliation choice. This matches the audit-trail discipline established in ADR-003's *Audit Trail Reconciliation Note*.

When CC resumes work on US-012 + US-013, the revised build brief must explicitly reference this Note as authoritative for the data layer.

---

*This ADR was authored on 2026-05-08 prior to implementation. It documents both the original DocuSign choice (now superseded) and the Built-in E-Sign decision that replaces it. The DocuSign integration code that was partially built will not be migrated — it should be removed or archived as a separate cleanup task tracked outside this ADR.*

*The Audit Trail Reconciliation Note appended on 2026-05-08 captures the discovery that the data layer pre-existed this ADR and the decision to adapt the spec to the live schema rather than recreate. The pre-existing schema is, in several material respects, better-designed than the original spec — denormalised quote data, readable stage names, and additive columns that improve both audit defensibility and ML-readiness.*
