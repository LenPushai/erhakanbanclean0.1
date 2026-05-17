# E-Sign Module Backlog — Canonical Definition of Done

| Field   | Value                                                                                          |
| ------- | ---------------------------------------------------------------------------------------------- |
| Date    | 2026-05-16                                                                                     |
| Status  | **Living document — updated as each story closes**                                             |
| Author  | Len Klopper / PUSH AI                                                                          |
| Purpose | Single canonical artefact answering "what's left in the E-Sign module before module-complete?" |

---

## Why this doc exists

Prior to 2026-05-16, the E-Sign module's outstanding work was scattered across: memory entries (`us-021-*`, `us-023-5-*`, `us-024a-*`, `us-027-*`), the audit doc (`decisions/US-023_esign_audit.md`), the schema migration plan (`decisions/US-023-schema-migration.md`), `TODO_PRE_MONDAY.md`, ADR-006 plus its three amendments, and git commit messages. The 2026-05-16 backlog audit confirmed there was no single document answering "what's left." This file is that document.

Definition of "E-Sign module complete":

1. All in-our-hands engineering items below are done-verified.
2. All deliberately-held items have been intentionally executed in their planned sequence.
3. All ERHA client-confirmation items have a confirmed answer recorded in an ADR-006 amendment (the answers themselves do not need to be the same; the *confirmation status* must be resolved).
4. All unspecified items are either specified-and-shipped or formally retired from scope.

---

## Status table (verified 2026-05-16)

| Story | Status | Tag / Commit | Blocker |
|-------|--------|--------------|---------|
| US-021 (email infrastructure staging) | DONE-VERIFIED | `phase1-email-notifications-staging-verified` @ `5557240` | — |
| US-022 (DNS flip + override removal) | **HELD (deliberate)** | — | **Sequencing owned by us** — held as terminal step after E-Sign testing complete. DNS key obtained from ERHA 2026-05-16; verify whether *applied-and-verified-in-Resend* vs *merely-obtained* before flip |
| US-023 (audit) | DONE | — | — |
| US-023 Phase 1 baseline migration | DONE-VERIFIED | Phase 1 applied `ec89210`; baseline file `8c4c3bc` | — |
| US-023 Phase 2 HIGH migration | DONE-VERIFIED | `phase1-us023-schema-phase2-high-verified` @ `569f193` | — |
| US-023 Phase 2 MEDIUM (Finding C) | NOT-STARTED | — | None (engineering-ready) |
| US-023 Phase 2 LOW (Findings D, E) | NOT-STARTED | — | None (engineering-ready, opportunistic) |
| US-023.5 (RLS lockdown) | DONE-VERIFIED | `phase1-us023-5-rls-lockdown-verified` @ `8800e9b` | — |
| US-024a (token closure) | DONE-VERIFIED | `phase1-us024a-token-closure-verified` @ `fe67c2a` | — |
| [US-024b](./US-024b-stage1-recipient-routing.md) (Stage 1 recipient routing) | **DONE-VERIFIED** | `phase1-us024b-stage1-recipient-routing-verified` @ `ebc0786` | — |
| [US-024c](./US-024c-stage1-fallback-approver.md) (Stage 1 fallback approver mechanism) | NOT-STARTED — design-blocked | — | Internal design decision: enabling mechanism (per-quote toggle vs temporary mode) — see [US-024c stub](./US-024c-stage1-fallback-approver.md) |
| US-025 | **UNSPECIFIED** | — | **No spec exists** — see Unspecified Scope section |
| US-026 | **UNSPECIFIED** | — | **No spec exists** — see Unspecified Scope section |
| US-027 (PDF stamping) | NOT-STARTED — spike complete | — | Synthetic Pastel fixture PDF needed before build |
| US-028 | **UNSPECIFIED** | — | **No spec exists** — see Unspecified Scope section |

---

## In-our-hands engineering — ready to ship without external decisions

Ordered roughly quick-wins-first:

1. **US-023.5 deferred #1** — `DROP POLICY` cleanup for `quote_signatures`'s 4 RLS policies with 2 duplicate pairs. Small migration, low risk.
2. **US-023 Phase 2 LOW** — Findings D (`signature_stage` `varchar`→`text` on `quote_signatures`) + E (`DROP INDEX idx_tokens_token`). Bundle or split as `005_..._signature_stage_type.sql` + `006_drop_redundant_idx_tokens_token.sql`. Idempotent.
3. **US-023 Phase 2 MEDIUM** — Finding C (`signature_stage` CHECK constraint + NOT NULL on both tables). `003_signature_stage_check.sql`. Similar pattern to Phase 2 HIGH but no DELETE, no FK.
4. **US-023.5 deferred #5** — `SignaturePage.tsx` privileged-data hardening (anon-key read of full `rfqs` row including pricing).
5. **US-027 (PDF stamping)** — ~3–4hr build per the spike. Synthetic Pastel fixture PDF as step 1.

*(US-023.5 deferred #6 closed 2026-05-17 — dead `emailManagerReviewAndSign` removed in commit `db769ee`. US-024b closed 2026-05-17 — tagged `phase1-us024b-stage1-recipient-routing-verified` on `ebc0786`. See Status Log for details.)*

---

## Held deliberately (our sequencing)

Items where the work is ready (or near-ready) but we have chosen to defer execution to a specific position in the sequence. These are **not externally blocked** — releasing them is a decision we own.

- **US-022 — Production DNS flip + outbound-email override removal.** Held as the **terminal step** before E-Sign module-complete declaration: the production flip happens after all E-Sign testing is done, so that during testing every outbound smoke-test still routes to `lenklopper03@gmail.com` rather than real customer addresses. Status of the DNS key itself as of 2026-05-16: **obtained from ERHA**, but it is **not yet confirmed** whether the key has been applied-and-verified in Resend or is merely held. That distinction must be resolved before the flip (a one-line check in the Resend dashboard).

---

## Blocked on ERHA / external decisions

- **[US-024c](./US-024c-stage1-fallback-approver.md)** — Stage 1 fallback approver mechanism. Waiting on internal design call (enabling mechanism — per-quote toggle vs temporary mode) and the schema design for `authorised_by` + `is_fallback` provenance columns. Once those land, the implementation is engineering-only. *(Note: "internal design call" is us-blocked, not ERHA-blocked — but the work has the same shape as ERHA-blocked items: a decision must precede the code.)*
- **US-023.5 deferred #2** — `/api/manager-approval-send` authentication. Coupled to RBAC roadmap (ADR-009).
- **US-023.5 deferred #3** — `/api/sign-validate` rate-limiting. Typically coordinated with the deploy that addresses #2.

---

## Open ADR-006 client-confirmation items (part of module-complete)

ADR-006's *Open Questions for Client Confirmation* section (lines 117–124) originally listed Q1–Q4. Q4 was resolved 2026-05-16 by the *Stage 1 Signing Authority & Gatekeeper Amendment*. **Q1, Q2, and Q3 remain open client-confirmation items.** They do not block US-024b/c or any other in-our-hands engineering item, but they ARE "what's left" for the module — module-complete declaration requires each to have a confirmed answer recorded as a forward ADR-006 amendment.

| Q | ADR-006 line | Current coded state | What's needed for module-complete |
|---|--------------|---------------------|------------------------------------|
| Q1 — Token TTL | line 119 | 7-day TTL (hardcoded as `7 * 24 * 60 * 60 * 1000` ms in `api/manager-approval-send.js` and `api/sign-submit.js` Stage 2 token creation) | ERHA confirms 7-day acceptable, OR specifies alternative (24h / 14d / other), recorded as a one-line forward ADR-006 amendment |
| Q2 — Signature method | line 120 | Both `drawn` (canvas) and `click` (default `'click'`) offered; `api/sign-submit.js` validates and stores both via `signature_type` | ERHA confirms both methods acceptable, OR specifies one-only (narrowing the offered UX), recorded as a one-line forward ADR-006 amendment |
| Q3 — Reminder cadence | line 121 | **Not coded.** ADR-006 explicitly defers to "Phase 2 enhancement" | ERHA confirms whether reminder emails are wanted (day-3 / day-6 cadence per the original Q3 wording) AND whether they're a Phase-1 module-complete prerequisite or a Phase-2 enhancement. If wanted in Phase 1, a separate story is added; if Phase 2, the deferral is the confirmed answer |

These confirmations move ADR-006's overall status from **Inferred — Awaiting Confirmation** to **Confirmed** (per the original ADR-006 framing at line 124: *"A 'yes' to question 1 (or an alternative TTL), plus answers to 2, 3, and 4, moves this ADR's status from Inferred to Confirmed."*). Q4 is already discharged; Q1/Q2/Q3 remain.

The single-line forward amendments can be batched into one dated ADR-006 *Q1+Q2+Q3 Client Confirmation Amendment* when ERHA returns the three answers — likely a 10-minute housekeeping commit, not a story unto itself.

---

## Unspecified scope — must be specified before they can be sized

The audit doc (`decisions/US-023_esign_audit.md:89`) collapses "remainder of the E-Sign module" into a four-item collective:

> US-025 – US-028 — Remainder of the E-Sign module per ADR-006: Stage 2 implementation lift-out from checkpoint-pending, signature audit-log surfacing, signer identity hardening, and DocuSign-deferred reversal path documentation.

These do not have individual specifications anywhere. They are **not buildable as written** — they need a definition pass before they can be sized, sequenced, or assigned.

| Story | Working title (inferred) | What's needed before this is buildable |
|-------|---------------------------|----------------------------------------|
| US-025 | Stage 2 implementation lift-out (from checkpoint-pending) | Customer-facing Stage 2 UI scope; the 501-return at `api/sign-submit.js`'s `client` branch needs replacement; the Stage 2 success flow (ORDER WON cascade trigger, kanban transition surface) needs end-to-end spec |
| US-026 | Signature audit-log surfacing | Where the audit surface lives (admin view? RFQ detail panel?); what fields are shown (`signed_at`, `signer_*`, `ip_address`, `user_agent`?); access-control matrix (who can see this) |
| US-028 | DocuSign-deferred reversal path documentation | An ADR amendment recording the conditions under which Built-in E-Sign would be retired in favour of DocuSign, and the migration steps |

"Signer identity hardening" from the audit doc's collective phrasing **does not have a clear story-number mapping** — it's the fourth named work-stream but isn't obviously US-025, -026, or -028. This is itself a gap.

**These stories must not be picked up for implementation until their scope is written.** Inventing scope at pickup time produces the kind of phantom-reference defect (the retracted "ADR-006 v2 / Jaco" claim) the project has had to retroactively correct.

---

## Update protocol

This document is **the living source of truth** for E-Sign module status. When any item moves status, update:

1. The status table at the top.
2. The relevant section (in-our-hands / held / blocked / open ADR-006 confirmations / unspecified) — items move between sections as their gating conditions change.
3. The Status Log at the bottom — append a dated entry recording the change.

This doc replaces the implicit pattern of carrying status in memory entries + audit doc + migration plan doc; those remain authoritative for their own narrow scopes (closeout details, audit findings, schema sequencing), but **module-level "what's left" lives here**.

---

## Status Log

- **2026-05-16** — Document created from the 2026-05-16 E-Sign backlog audit. Initial status table verified against tags, commits, and the live `decisions/` + memory tree. Q4 + Q5 marked as resolved by the ADR-006 *Stage 1 Signing Authority & Gatekeeper Amendment* of the same date; Q1, Q2, Q3 recorded as open client-confirmation items. US-024c carved out as a new story (Stage 1 fallback approver mechanism). US-022 reclassified from "blocked on ERHA" to "held deliberately (our sequencing)" with DNS key obtained 2026-05-16; applied-vs-merely-obtained status to be verified before flip. US-025/026/028 marked UNSPECIFIED, with the gap explicitly logged.
- **2026-05-16** — Dewald's email address confirmed by ERHA as `dewald@erha.co.za`. US-024b external prerequisite cleared; status moves from "Buildable — pending email" to "Engineering-ready". `STAGE_1_APPROVER.email` placeholder replaced in [`decisions/US-024b-stage1-recipient-routing.md`](./US-024b-stage1-recipient-routing.md). Remaining work for US-024b is code-only (three sites in `api/manager-approval-send.js`) plus the apply runbook.
- **2026-05-17** — US-024b verified-complete and tagged `phase1-us024b-stage1-recipient-routing-verified` on `ebc0786`. Stage 1 routing now goes to Dewald (`dewald@erha.co.za`); six sites landed (3 server-side routing in `api/manager-approval-send.js` + 3 client-side approver-agnostic in `src/App.tsx`); completeness re-grep across the full Stage 1 path confirmed no Site 7; outbound override at `api/send-email.js:48` held active throughout the smoke-test, no ERHA recipient paged.
- **2026-05-17** — US-023.5 deferred #6 closed. Dead-code `emailManagerReviewAndSign` (and its 3-line comment header) removed from `src/emailService.ts` in commit `db769ee`. Audit confirmed zero active call-sites, zero re-exports, zero test references; only consumers were inside the function body, in inert `src/App.tsx.bak*` snapshots, and in the in-our-hands engineering list (also removed). `RECIPIENTS` const and the `ALL` array left intact — both have 12 live consumers in the team-broadcast notification functions, independent of the removed function. No runtime behavior change; no smoke-test required.
