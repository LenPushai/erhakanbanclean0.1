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

## Three site changes

Each replaces a hardcoded string with a reference to `STAGE_1_APPROVER.email` or `.name`. Line locations are accurate as of 2026-05-16 (re-verified in the 2026-05-16 backlog audit); re-verify at implementation time as defensive practice.

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

---

## Out of scope (explicit)

- **No RFQ-assignment-field logic.** The handler does not consult `rfq.assigned_to`, `rfq.quoter_id`, or any equivalent column. The approver is config-level, not row-level. This is a deliberate departure from earlier "routing by RFQ's assigned quoter" framing in the retracted audit-doc entry — the ADR-006 amendment Decision 1 narrows to a single named approver.
- **No fallback path.** If Dewald is unavailable in practice, Stage 1 blocks until [US-024c](./US-024c-stage1-fallback-approver.md) ships. The handler's current single-recipient model is preserved; only the recipient identity changes.
- **No schema change.** Provenance columns (`authorised_by`, `is_fallback`) are US-024c scope.
- **No code-side authorisation check.** Whether the caller of `/api/manager-approval-send` is allowed to send (per ADR-006 amendment Decision 2's gatekeeper matrix) is US-023.5 deferred follow-up #2 (`/api/manager-approval-send` authentication) — separate story, separate PR.

---

## Apply runbook

Simpler than US-024a — no migration, no NOT NULL, no two-step deploy:

1. Confirm Dewald's email address with ERHA (one-line).
2. Replace the placeholder in `STAGE_1_APPROVER.email`.
3. Commit (code-only).
4. Push → Vercel auto-deploy.
5. Smoke-test: trigger one Stage 1 "Send for Manager Approval" on a non-production RFQ; verify the resulting `signature_tokens` row has `client_email = <Dewald's email>` and `client_name = 'Dewald'`, and that Dewald receives the email.
6. Tag `phase1-us024b-stage1-recipient-routing-verified` on the verified commit.

No DB-side apply. No NOT NULL gate. Single-file code change plus an optional Status Log entry update in [ESIGN-BACKLOG.md](./ESIGN-BACKLOG.md).
