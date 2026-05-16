# US-024b — Stage 1 Recipient Routing (Dewald as sole approver)

| Field   | Value                                                                                                                |
| ------- | -------------------------------------------------------------------------------------------------------------------- |
| Date    | 2026-05-16                                                                                                            |
| Status  | **Engineering-ready** (external prerequisite cleared 2026-05-16 — see *Prerequisite* below)                            |
| Author  | Len Klopper / PUSH AI                                                                                                 |
| Parent  | [ADR-006 *Stage 1 Signing Authority & Gatekeeper Amendment (2026-05-16)*](./ADR-006-e-sign-built-in-two-stage.md#stage-1-signing-authority--gatekeeper-amendment-2026-05-16) |
| Blocks  | E-Sign module-complete (per [ESIGN-BACKLOG.md](./ESIGN-BACKLOG.md))                                                  |

---

## Scope

Replace the hardcoded Hendrik in `api/manager-approval-send.js` (three sites) with the Dewald-as-Stage-1-sole-approver config, per ADR-006 *Stage 1 Signing Authority & Gatekeeper Amendment (2026-05-16)* Decision 1. No assignment-field logic, no automatic fallback chain. The Jeanic-authorised Hendrik fallback path is [US-024c](./US-024c-stage1-fallback-approver.md) and not implemented here.

---

## Approver config

A single named-approver constant at the top of `api/manager-approval-send.js`, replacing the three hardcoded Hendrik strings.

```js
// Stage 1 approver — see ADR-006 Stage 1 Signing Authority & Gatekeeper
// Amendment (2026-05-16). Sole approver = Dewald; no assignment-field
// routing, no automatic fallback. The Jeanic-authorised Hendrik fallback
// path is US-024c and not implemented here.
const STAGE_1_APPROVER = {
  email: 'dewald@erha.co.za',
  name: 'Dewald',
};
```

**Prerequisite — RESOLVED 2026-05-16.** ERHA confirmed Dewald's email address as `dewald@erha.co.za` — which does match the `firstname@erha.co.za` pattern Hendrik's address suggested, but the confirmation discipline mattered: `Grep` for `[Dd]ewald.*@` returned no matches across `api/`, `src/`, `decisions/`, `scripts/` as of the 2026-05-16 audit, and assuming the pattern without confirmation would have been the same class of defect as the retracted "Jaco" confabulation. The confirmed address is now embedded in `STAGE_1_APPROVER.email` above; the story moves to engineering-ready, code-only.

---

## Site changes

Sites 1–3 replace server-side hardcoded strings in `api/manager-approval-send.js` with references to `STAGE_1_APPROVER.email` or `.name`. **Sites 4, 5, and 6 (all added 2026-05-16 by the build audit + the completeness re-grep that followed)** are in `src/App.tsx`'s `handleSendForManagerApproval` and surrounding scope — Site 4 in the operator confirm dialog text, Site 5 in the JSDoc comment block immediately above the function, Site 6 in the success-path alert at the end of the handler. All three use approver-agnostic wording rather than a client-side mirror of the approver name. Line locations are accurate as of 2026-05-16; re-verify at implementation time as defensive practice.

### Site 1 — `client_email` in the `signature_tokens` INSERT payload

```diff
-      client_email: 'hendrik@erha.co.za',
+      client_email: STAGE_1_APPROVER.email,
```

### Site 2 — `client_name` in the same INSERT payload

```diff
-      client_name: 'Hendrik',
+      client_name: STAGE_1_APPROVER.name,
```

### Site 3 — `to` array in the `fetch` to `/api/send-email`

```diff
-      body: JSON.stringify({ to: ['hendrik@erha.co.za'], subject, html }),
+      body: JSON.stringify({ to: [STAGE_1_APPROVER.email], subject, html }),
```

### Site 4 — operator confirm dialog (`src/App.tsx`, in `handleSendForManagerApproval`)

**Discovered by the 2026-05-16 build audit, not in the original three-site spec.** The Stage 1 trigger handler in the React app shows a confirmation dialog whose text named Hendrik:

```diff
-    if (!confirm(`Send "${rfq.rfq_no || rfq.enq_number || 'this quote'}" to Hendrik for manager sign-off?`)) return
+    if (!confirm(`Send "${rfq.rfq_no || rfq.enq_number || 'this quote'}" for manager sign-off?`)) return
```

**Fix: approver-agnostic wording — the person's name is removed entirely.** No Hendrik, no Dewald, no client-side mirror of `STAGE_1_APPROVER.name`. Rationale:

1. **Anti-pattern avoidance.** Hardcoding the approver name on the client side (whether "Dewald" or a `STAGE_1_APPROVER`-equivalent client const) re-creates exactly the scattered-routing-knowledge anti-pattern US-024b is consolidating. The server is the single source of truth for *who* approves Stage 1; the UI does not need to mirror that knowledge to ask "send for sign-off?".
2. **Forward-correct for [US-024c](./US-024c-stage1-fallback-approver.md).** When the fallback mechanism ships and the actual Stage 1 approver depends on whether the Dewald-unavailable mode is active, an approver-agnostic dialog reads correctly under both flows. A "Send to Dewald?" dialog would be misleading during fallback periods (where Hendrik is acting in Dewald's role).

The dialog asks the operator's intent (do they want to dispatch for sign-off?); it does not disclose, and does not need to disclose, the routing destination.

**Audit footnote.** Site 4 was missed by the original three-site spec because the spec scope was framed as "routing hardcodes" — and the dialog text is technically display copy, not routing. The 2026-05-16 build audit (per the spec's own re-verify-at-implementation-time discipline) caught it as a UX/routing-contradiction footgun: shipping sites 1–3 alone would have produced "Send to Hendrik?" in the dialog while the actual email went to Dewald. The audit-first discipline that caught it is the same discipline that produced this spec update.

### Site 5 — function JSDoc comment block (`src/App.tsx:937-939`, above `handleSendForManagerApproval`)

**Caught by the same build audit pass that found Site 4** — the initial `[Hh]endrik` grep had truncated context around the line-941 match and missed the comment block immediately above. The original comment described pre-US-024b state:

```diff
-    // and dispatch the manager review-and-sign email. Hendrik is the only
-    // recipient in v1 per ADR-006 (Dewald fallback deferred to v2).
+    // and dispatch the manager review-and-sign email. Stage 1 approver
+    // routing is server-side per ADR-006 Stage 1 Signing Authority &
+    // Gatekeeper Amendment (2026-05-16); see api/manager-approval-send.js
+    // STAGE_1_APPROVER for the current target.
```

**Fix: approver-agnostic, points at the server source of truth.** Same rationale as Site 4 — don't duplicate routing knowledge on the client side. The comment now anchors readers to (i) the authoritative ADR amendment for the routing decision and (ii) the actual const that implements it, rather than naming a person whose role might shift under [US-024c](./US-024c-stage1-fallback-approver.md)'s fallback flow.

**Retracted phrasing.** The old comment carried *"Dewald fallback deferred to v2"* — same retracted "v2" framing as the ADR-006 v2 / Jaco phantom previously corrected in commit `4fc19a5`. Removing it here completes that retraction across the Stage 1 path.

### Site 6 — function success-path alert (`src/App.tsx:957`, end of `handleSendForManagerApproval`)

**Caught by the 2026-05-16 completeness re-grep** (untruncated sweep over the full handler region — the success-path alert sits below line 941 and was outside the truncated context window of the initial `[Hh]endrik` grep that found Sites 4 and 5). The original alert named Hendrik:

```diff
-      alert('Sent to Hendrik for sign-off. Once signed, the customer will be emailed automatically.')
+      alert('Sent for manager sign-off. Once signed, the customer will be emailed automatically.')
```

**Fix: approver-agnostic, person's name removed entirely.** Same rationale as Sites 4 and 5 — don't duplicate routing knowledge client-side; forward-correct for [US-024c](./US-024c-stage1-fallback-approver.md)'s fallback flow. Left unfixed, this alert would have produced the inverse of the Site 4 contradiction: dialog and email-routing both correct, but the success-confirmation text would tell the operator the email went to Hendrik when it actually went to Dewald.

---

## Out of scope (explicit)

- **No RFQ-assignment-field logic.** The handler does not consult `rfq.assigned_to`, `rfq.quoter_id`, or any equivalent column. The approver is config-level, not row-level. This is a deliberate departure from earlier "routing by RFQ's assigned quoter" framing in the retracted audit-doc entry — the ADR-006 amendment Decision 1 narrows to a single named approver.
- **No fallback path.** If Dewald is unavailable in practice, Stage 1 blocks until [US-024c](./US-024c-stage1-fallback-approver.md) ships. The handler's current single-recipient model is preserved; only the recipient identity changes.
- **No schema change.** Provenance columns (`authorised_by`, `is_fallback`) are US-024c scope.
- **No code-side authorisation check.** Whether the caller of `/api/manager-approval-send` is allowed to send (per ADR-006 amendment Decision 2's gatekeeper matrix) is US-023.5 deferred follow-up #2 (`/api/manager-approval-send` authentication) — separate story, separate PR.
- **No dynamic live-approver display in the confirm dialog (Site 4).** A future enhancement could surface the actual current approver in the dialog text (e.g. "Send to Dewald" by default, "Send to Hendrik" during a Dewald-unavailable mode), but it is **not US-024b scope**. If ever built, the displayed name must source from real routing state (likely an `/api/stage-1-approver-current` lookup or its equivalent), **not** from a hardcoded client-side mirror of `STAGE_1_APPROVER`. Re-introducing client-side hardcoded approver names would regress the routing-consolidation US-024b achieves.

---

## Apply runbook

Simpler than US-024a — no migration, no NOT NULL, no two-step deploy:

1. Confirm Dewald's email address with ERHA (one-line).
2. Replace the placeholder in `STAGE_1_APPROVER.email`.
3. Commit (code-only).
4. Push → Vercel auto-deploy.
5. **Smoke-test verification (production, override remains active — see *Smoke-test verification basis* section below).** Step-by-step:
   - (a) Trigger one Stage 1 "Send for Manager Approval" on a non-production RFQ; confirm the dialog reads `Send "<rfq>" for manager sign-off?` (approver-agnostic; no person name).
   - (b) DB-row check: the resulting `signature_tokens` row has `client_email = 'dewald@erha.co.za'`, `client_name = 'Dewald'`, and `signature_stage = 'manager'`. Runtime proof of Sites 1 + 2.
   - (c) Inbox check (Len's `lenklopper03@gmail.com`): the Stage 1 email arrives there. The outbound override at `api/send-email.js:48` redirects all outbound mail to Len's inbox while US-022 is held.
   - (d) **Negative assertion — `dewald@erha.co.za` MUST receive nothing.** Confirm via separate channel; if Dewald reports receiving the email, the outbound override has been disabled accidentally — escalate immediately and revert before proceeding.
6. Tag `phase1-us024b-stage1-recipient-routing-verified` on the production-verified commit, only after (a), (b), (c), (d) all pass.

No DB-side apply. No NOT NULL gate. Code-only changes — two files (`api/manager-approval-send.js` + `src/App.tsx`) — plus an optional Status Log entry update in [ESIGN-BACKLOG.md](./ESIGN-BACKLOG.md).

---

## Smoke-test verification basis (added 2026-05-16)

Recording precisely what the smoke-test proves and how, so the verification evidence can be defended after the fact:

- **Sites 1 and 2 are runtime-proven by the DB-row check (step 5(b)).** The `signature_tokens` INSERT writes `client_email` and `client_name` directly to columns observable from SQL. Step 5(b) reads those columns; matching values prove the server-side INSERT received the Dewald constant rather than the old hardcoded Hendrik strings.
- **Site 3 is verified structurally, not at runtime.** The `to: [STAGE_1_APPROVER.email]` in the `fetch` to `/api/send-email` is structurally verified by (i) the diff confirming the literal swap from `'hendrik@erha.co.za'` to the const reference, plus (ii) `STAGE_1_APPROVER.email`'s shared-const propagation — the same constant Site 1 reads is what Site 3 reads. Because `/api/send-email`'s outbound override (line 48) unconditionally replaces the incoming `to` array with `['lenklopper03@gmail.com']` before dispatching to Resend, the actual runtime value of the `to: []` parameter on the `fetch` is **not observable from inbox content**. The audit trail relies on the diff + the shared-const, not on inbox evidence.
- **Site 4 is verified by the diff plus operator observation** in step 5(a). The diff records the literal swap from "Send '...' to Hendrik for manager sign-off?" to "Send '...' for manager sign-off?"; step 5(a) confirms the operator sees the new wording when triggering Stage 1.
- **Override status is verified by negative assertion** in step 5(d). The outbound override is the safety net keeping this smoke test safe; if it has been removed accidentally, Dewald gets paged and the smoke test would no longer be safe to repeat. Step 5(d) catches that drift.

**No temporary logging or debug output is added** for this smoke test. The verification basis is what the existing code produces (DB rows + inbox content) plus the diff itself. **The override is not disabled** — the negative assertion in step 5(d) is meaningful only with the override active.
