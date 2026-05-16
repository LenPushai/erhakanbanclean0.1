# US-024c — Stage 1 Fallback Approver Mechanism

| Field   | Value                                                                                                                |
| ------- | -------------------------------------------------------------------------------------------------------------------- |
| Date    | 2026-05-16 (stub)                                                                                                     |
| Status  | **Design-blocked** — see Open Design Decisions below                                                                  |
| Author  | Len Klopper / PUSH AI                                                                                                 |
| Parent  | [ADR-006 *Stage 1 Signing Authority & Gatekeeper Amendment (2026-05-16)*](./ADR-006-e-sign-built-in-two-stage.md#stage-1-signing-authority--gatekeeper-amendment-2026-05-16) |
| Blocks  | E-Sign module-complete (per [ESIGN-BACKLOG.md](./ESIGN-BACKLOG.md))                                                  |

---

## Scope

Implement the Jeanic-authorised Hendrik fallback for Stage 1 signing, per ADR-006 *Stage 1 Signing Authority & Gatekeeper Amendment (2026-05-16)* Decision 1. When Dewald (the default Stage 1 sole approver per [US-024b](./US-024b-stage1-recipient-routing.md)) is unavailable, Jeanic explicitly authorises Hendrik to sign as the exceptional approver, with distinct provenance recorded on the resulting `quote_signatures` row.

[US-024b](./US-024b-stage1-recipient-routing.md) is the prerequisite (Dewald as default) — US-024c adds the fork.

### Business model context (clarified 2026-05-16)

Stage 1 fallback is **not** a per-quote co-sign or per-RFQ ad-hoc authorisation. The operational reality:

- **Trigger:** Dewald is unavailable (sick, leave, otherwise off). The trigger is a *period*, not a *quote*.
- **Hendrik's role during the period:** assumes Dewald's full duties — estimation, quotation, and Stage 1 signing — for the duration of Dewald's absence. This is a managed role-handover, not an ad-hoc per-RFQ authorisation.
- **Jeanic's role:** RFQ-flow and process custodian. Supplies Hendrik the internal-process information he needs to perform the role, and operates the activation/deactivation of the unavailable-mode. Jeanic is the **operational control point** of the mode — she doesn't sign Stage 1, but she gates the state in which Hendrik does.

US-024c is the **Stage 1 signing piece** of this broader role-handover. The estimation/quotation handover (Hendrik working RFQs through to QUOTED while Dewald is out) is operational workflow, not code-side scope for this story.

---

## Open design decisions (must be resolved before code)

1. **Enabling mechanism — STRONGLY INDICATED as temporary "Dewald-unavailable" mode (narrowed 2026-05-16).** The clarified business model above (period-based role-handover) decisively narrows this toward the **temporary-mode** form: Jeanic activates the mode at the start of Dewald's unavailability and deactivates it on his return; all Stage 1 sends during the active window route to Hendrik. The per-quote-toggle alternative is operationally awkward — it would force a Jeanic click on every quote during Dewald's absence, which does not match the actual workflow (handover for a period, not ad-hoc per-RFQ).

   **Not marked fully resolved** because the temporary-mode design itself has sub-questions still open: scope (entire system vs per-operating-entity vs per-RFQ-status?), duration semantics (open-ended until Jeanic toggles off vs auto-expire after N days?), and concurrency (multiple unavailable periods overlapping; mode toggled on while Dewald is in fact present). These are design-time decisions for US-024c, not blockers for the story's existence.

2. **Schema for provenance — sharpened (2026-05-16).** ADR-006 amendment Decision 1 requires that the resulting `quote_signatures` row records `signer = Hendrik`, `authorised-by = Jeanic`, `flagged fallback`. Given the clarified temporary-mode business model, the sharpened design question is **which of two semantics** the schema records:

   - **Option A — per-signature authorisation.** `quote_signatures.authorised_by_email` (or `authorised_by_user_id` if RBAC is mature enough) plus `is_fallback boolean default false`. Records Jeanic as the per-signature authoriser, even though her authorisation conceptually flows from the mode being active. Simpler schema; loses the temporal grouping of "all these signatures came from the same handover period".
   - **Option B — mode-as-provenance.** A separate `dewald_unavailable_periods` table with `activated_at`, `deactivated_at`, `activated_by`, `deactivated_by`. `quote_signatures` carries a `dewald_unavailable_period_id` FK referencing the active period the signature was produced under. The signature row inherits provenance via the FK; Hendrik is recorded as acting-in-Dewald's-role for that period, not authorised-per-signature.

   Option B reflects the actual operational model more faithfully (period-based handover) and is the schema preference suggested by the ML-first / audit-grade note below. Option A is simpler but discards exactly the temporal information that makes the mode auditable after the fact.

   Plus the corresponding token-side state (a column on `signature_tokens` carrying the period reference or fallback flag) so `api/sign-submit.js`'s INSERT into `quote_signatures` can propagate the right provenance values from the token, mirroring the US-024a `signature_token_id` linkage pattern.

3. **UI surface for Jeanic's authorisation action.** Where does the "Authorise Hendrik" control live? Options:
   - RFQ card overflow menu (per-quote toggle form)
   - Admin panel with a toggle (temporary mode form)
   - Both

4. **Routing in `api/manager-approval-send.js`.** With [US-024b](./US-024b-stage1-recipient-routing.md) shipped, the handler routes to Dewald by default. US-024c adds a fork: read the authorisation state at request time and route to Hendrik if (and only if) authorisation is active for the relevant scope.

5. **Audit-log surfacing.** The fallback signing event is operationally significant — should it surface in the activity log with a distinguished `action_type` (e.g. `quote_signed_stage_1_fallback`)? Likely yes; needs cross-reference with the as-yet-unspecified US-026 audit-log surfacing story (see [ESIGN-BACKLOG.md](./ESIGN-BACKLOG.md) "Unspecified scope").

---

## ML-first / audit-grade design note (added 2026-05-16)

The mode's activation and deactivation must be captured as **timestamped events**, not as a bare boolean toggle on a config row. Two reasons:

1. **ML feature value.** Over time, the duration and frequency of Dewald-unavailable periods become a feature signal — for staffing models, capacity planning, Stage 1 throughput forecasting, and signature-behaviour analysis. A bare boolean discards all of this; an event-capture table preserves it as a natural by-product of normal operation.
2. **Audit defensibility.** A signed quote produced under fallback authority needs to trace back to *which* unavailable period authorised the handover, with start and end timestamps. A bare boolean cannot answer "was the mode active when this signature was produced?" after the fact if it was later toggled. The event-capture form makes the answer a deterministic FK lookup.

This is consistent with the project's ML-first mandate (ADR-006 *Reconciliation Note*, "additive columns" + event-capture preference) and the audit-trail discipline established across US-023 and the FK Activation amendment. It is also the design pressure behind preferring **Option B** in the "Schema for provenance" decision above.

---

## Definition of done

- ADR-006 amendment formalising the enabling-mechanism choice (per-quote or temporary mode) lands before any code.
- Schema migration adds the provenance columns (`authorised_by`, `is_fallback`, plus the token-side counterparts) with appropriate FKs and defaults. NOT NULL on the new columns is deferred to a follow-up if the existing `quote_signatures` rows can't be backfilled (mirror US-024a discipline).
- `api/manager-approval-send.js` routes to Hendrik when authorisation is active, populates `signature_tokens.authorised_by` + the fallback flag.
- `api/sign-submit.js` propagates the token's fallback state into the resulting `quote_signatures` row.
- UI surface for Jeanic's authorisation action lands (form depends on Decision 1 above).
- End-to-end smoke test: Jeanic authorises Hendrik on a test RFQ → token goes to Hendrik → Hendrik signs → `quote_signatures` row has correct provenance.
- Tag `phase1-us024c-stage1-fallback-verified` on the verified commit.

---

## Not in scope

- [US-024b](./US-024b-stage1-recipient-routing.md)'s default-recipient swap (Hendrik → Dewald) — separate story, prerequisite for this one.
- General RBAC role definition / single-role model — ADR-008 / ADR-009 territory.
- Signature audit-log surfacing (US-026, currently unspecified per [ESIGN-BACKLOG.md](./ESIGN-BACKLOG.md)) — coupled but independent; US-024c just ensures the provenance is *recorded*; US-026 surfaces it.
