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

---

## Open design decisions (must be resolved before code)

1. **Enabling mechanism — per-quote toggle vs temporary mode.** Two candidate forms:
   - **Per-quote toggle:** Jeanic clicks "Authorise Hendrik for this quote" on the specific RFQ's card. The authorisation is scoped to that one Stage 1 signing event.
   - **Temporary mode:** Jeanic toggles "Hendrik can sign Stage 1" for a bounded window (e.g. 24h). Any Stage 1 sent during that window routes to Hendrik instead of Dewald.
   - **Tradeoff:** per-quote is more granular and audit-friendly; temporary mode is less click-heavy when Dewald is unavailable for a known period (leave, illness). The choice affects the schema (per-quote flag on `signature_tokens` vs a separate `fallback_mode` row) and the UX surface.

2. **Schema for provenance.** ADR-006 amendment Decision 1 requires `signer = Hendrik`, `authorised-by = Jeanic`, `flagged fallback` on the resulting `quote_signatures` row. Two columns needed (working names):
   - `authorised_by_email` (or `authorised_by_user_id` if RBAC is mature enough)
   - `is_fallback boolean default false`

   Plus a corresponding column on `signature_tokens` to record that the token was issued under the fallback mode (so the `api/sign-submit.js` insert at the time of signing can populate `authorised_by` and `is_fallback` on `quote_signatures` from the token, mirroring the US-024a `signature_token_id` linkage pattern).

3. **UI surface for Jeanic's authorisation action.** Where does the "Authorise Hendrik" control live? Options:
   - RFQ card overflow menu (per-quote toggle form)
   - Admin panel with a toggle (temporary mode form)
   - Both

4. **Routing in `api/manager-approval-send.js`.** With [US-024b](./US-024b-stage1-recipient-routing.md) shipped, the handler routes to Dewald by default. US-024c adds a fork: read the authorisation state at request time and route to Hendrik if (and only if) authorisation is active for the relevant scope.

5. **Audit-log surfacing.** The fallback signing event is operationally significant — should it surface in the activity log with a distinguished `action_type` (e.g. `quote_signed_stage_1_fallback`)? Likely yes; needs cross-reference with the as-yet-unspecified US-026 audit-log surfacing story (see [ESIGN-BACKLOG.md](./ESIGN-BACKLOG.md) "Unspecified scope").

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
