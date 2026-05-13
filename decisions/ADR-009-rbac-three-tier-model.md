# ADR-009 — Phase 1 RBAC: Three-Tier Role Model

## Status

**Implemented (in progress).** Section 2.6.3 closed 2026-05-13, tag `phase1-rbac-section-2.6.3-complete` at commit `a220f17`. Workshop board JobExecutionPanel write surfaces fully gated to FULL tier. Remaining sections (§2.6.4 / §2.7 onward) to be scoped.

## Document provenance

This ADR is a **retroactive reconstruction** assembled on 2026-05-13 from:

- The inline comment block in `src/App.tsx` introducing the `TIER_BY_ROLE`, `getTier`, `canWrite`, and `canWriteRFQ` helpers
- The patcher script (`patch-add-rbac-helpers.cjs` or equivalent) that originally inserted those helpers
- The commit trail of approximately 22 rows referencing this ADR (rows ~11 through 27, across multiple sections)
- Session handover documents and Claude conversation transcripts dated late April through May 2026

The original decision-making conversations pre-dated this written document. The ADR was never persisted to `decisions/` at the time of implementation. This commit closes that gap. Sections marked **TBD** require Len's input to complete.

## Context

The ERHA Operations System entered soft-production parallel run with the legacy Excel workflow in early April 2026. At that point, all 10 system roles defined in `VALID_ROLES` had identical write privileges. Any logged-in user could perform any state-changing action on any record. This was acceptable for demo and early UAT but unacceptable for sustained production use, where the system handles real financial documents (RFQs, POs, quotes), real job scheduling, and real workshop execution.

Specifically:

- Real users were now logging in by role (Hendrik, Jeanic, Dewald, Cherise) and the absence of permission boundaries meant any role could (accidentally or otherwise) modify records outside their operational scope.
- Six of the ten role slots (SONJA, CHARLES, JACO, ELSJE, ALWYN, ZACH) were retained in `VALID_ROLES` from earlier scoping but had no current users. They needed to be hidden from the login UI without being removed from the underlying role enum, to preserve compatibility with any legacy data referencing them.
- A full feature-grade RBAC system (per-permission ACLs, per-record ownership, group hierarchies) was out of scope. Phase 1 needed a pragmatic tier model that could be implemented in `App.tsx` without schema changes or new tables.

## Decision

Three-tier role model, implemented as two helper functions and a single tier-lookup table, all colocated in `src/App.tsx` above the main component tree.

### Tiers

| Tier | Members | Write rights |
|------|---------|---|
| **FULL** | HENDRIK, JUANIC | All write actions, all surfaces |
| **QUOTER** | DEWALD | RFQ writes only, and only on RFQs where `assigned_quoter_name === 'Dewald'` |
| **READER** | CHERISE | No writes anywhere |

Dormant roles (SONJA, CHARLES, JACO, ELSJE, ALWYN, ZACH) are intentionally absent from `TIER_BY_ROLE`. `getTier()` returns `null` for them, which denies all writes via the helper functions. They remain in `VALID_ROLES` for backward compatibility but are hidden from the `RoleSelector` UI.

### Helpers (canonical implementation)

```typescript
type RoleTier = 'FULL' | 'QUOTER' | 'READER'

const TIER_BY_ROLE: Record<string, RoleTier> = {
  HENDRIK: 'FULL',
  JUANIC:  'FULL',
  DEWALD:  'QUOTER',
  CHERISE: 'READER',
}

function getTier(role: string | null): RoleTier | null {
  return role ? (TIER_BY_ROLE[role] ?? null) : null
}

// Generic write gate. FULL tier only. Used for non-RFQ surfaces:
// Workshop, Settings, Procurement, Supplier/Client CRUD, Job-level edits,
// Direct Job creation, Jarison import.
function canWrite(role: string | null): boolean {
  return getTier(role) === 'FULL'
}

// RFQ-specific write gate. FULL tier always, plus QUOTER (DEWALD) when the
// RFQ is assigned to him. The match is case-sensitive against the
// proper-case string ('Dewald'), NOT the uppercase role key ('DEWALD').
function canWriteRFQ(role: string | null, rfq: { assigned_quoter_name?: string | null }): boolean {
  const tier = getTier(role)
  if (tier === 'FULL') return true
  if (tier === 'QUOTER' && role === 'DEWALD' && rfq.assigned_quoter_name === 'Dewald') return true
  return false
}
```

### Naming and casing

- **Role keys** are uppercase (`'HENDRIK'`, `'JUANIC'`, `'DEWALD'`, `'CHERISE'`). These are the strings stored in the `role` column, in `localStorage`, and in `assigned_to`-style fields.
- **`JUANIC` is a legacy typo** preserved as the storage key. Display rendering uses `ROLE_DISPLAY_NAMES['JUANIC'] = 'Jeanic'`. The typo is not corrected because that would require a data migration across all historical records that reference the role.
- **`assigned_quoter_name`** is proper-case (`'Dewald'`), not the uppercase role key. The match in `canWriteRFQ` is case-sensitive against the proper-case form, not the role key.

### Defense-in-depth

Every gated write surface receives **two layers** of permission check:

1. **UI gate** — the trigger button (or the submit button for modal writes) is wrapped in `{canWrite(role) && <button>...}` or `{canWriteRFQ(role, rfq) && <button>...}`. If the user lacks permission, the button is not rendered.
2. **Handler gate** — the named handler function (e.g. `handleSaveNotes`) begins with `if (!canWrite(role)) { alert(...); return }`. This catches any execution path that reaches the handler without going through the gated UI.

For modal writes there is implicitly a **third layer** in that the trigger button gate prevents the user from opening the modal in the first place. The modal's outer `{showXxxModal && (...)}` conditional render is NOT gated — gating it would orphan modal state if a tier change happened mid-session.

### Surface types and pattern variants

The audit work identified four surface shapes, each with a specific gating pattern.

**1. Named handler + standalone button.**
Wrap the button in `{canWrite(role) && <button onClick={handler}>...}` (the standalone-braces pattern). Add the early-return guard to the handler.

**2. Named handler + button inside an existing ternary.**
Extend the existing condition: `{existingCondition && canWrite(role) && (<button>...)}`. Bare `canWrite(role)` inside the ternary chain. Add the early-return guard to the handler.

**3. Per-row button inside a `<td>` (e.g. delete x in a table row).**
Wrap the inner button, not the `<td>` itself. Keeping the `<td>` shell unconditional preserves column alignment for non-FULL viewers. Add the early-return guard to the handler.

**4. Inline input with `onBlur` save (e.g. delivery fields).**
Field stays editable. Guard fires at the named handler with the alert + early return. Field value reverts on next refresh because no DB write occurred. This is the "visible no-op" pattern.

Form fields inside modals are NOT gated individually — the modal trigger is gated, so a non-FULL user cannot reach the form. Modal submit + named handler are the write boundary.

### Alert wording convention

All permission-denied alerts follow the template:

> Permission denied: only a manager (Managing Director or Operations System Manager) can &lt;verb&gt; &lt;noun&gt;.

Verb/noun pairs in production as of §2.6.3 close:

- update delivery information
- assign workers to jobs
- clock workers in
- clock workers out
- sign off QC checkpoints
- log materials
- delete material records
- save workshop notes

Earlier rows (pre-§2.6.3) follow the same template with their own verb/noun. **TBD: complete inventory of pre-§2.6.3 verb/noun pairs from rows 11 through 21.**

## Implementation status

### §2.6.1 — *TBD*

Pre-§2.6.2 RBAC rows (approximately rows 11 through 20a) covered JobDetailPanel, the Create Direct Job modal, the Jarison Import modal, the Spawn Job modal, and earlier handlers. Relevant `role` plumbing was established here as a prerequisite for later sections.

Confirmed plumbing commits (role prop destructured / passed through):

- Row 13 — CreateDirectJobModal
- Row 14 — JarisonImportModal
- Row 15 — JobDetailPanel (`b4b9033`)
- Row 16 (continued) — SpawnJobModal (`f1b97ac`)
- Row 20c — WorkshopBoard and JobExecutionPanel (`4103b94`)

**TBD: Len to confirm exact section number(s) and full row inventory for §2.6.1.**

### §2.6.2 — Workshop board state and line items (closed)

- Row 20b — `handleWorkshopStatusChange` (commit `52e04f7`)
- Row 20c — `JobExecutionPanel.handleLineItemToggle` + cascade writes (commit `4103b94`)
- Auto-clock-in side-effect inside `handleWorkshopStatusChange` transitively gated by row 20b
- Row 21 — *TBD: surface and commit*

### §2.6.3 — Workshop board JobExecutionPanel write surfaces (closed 2026-05-13)

| Row | Commit | Surface | Pattern |
|-----|--------|---|---|
| 22 | `9dad337` | `handleDeliveryField` (inline `onBlur` writes for `delivery_number`, `delivery_date`) | Pattern 4 — visible no-op |
| 23 | `f383a48` | `handleAssignWorker` (three-point modal: trigger + handler + submit) | Pattern 1 |
| 24 | `7c886e4` | `handleClockIn` / `handleClockOut` (paired) | Pattern 2 — ternary extension |
| 25 | `5eb96f4` | `handleSignOff` (QC checkpoint sign-off, three-point modal) | Patterns 1 + 2 |
| 26 | `5ebf800` | `handleLogMaterial` / `handleDeleteMaterial` (paired) | Pattern 1 + Pattern 3 for per-row delete |
| 27 | `a220f17` | `handleSaveNotes` (two-point standard) | Pattern 1 |

Closed at tag `phase1-rbac-section-2.6.3-complete` (`a220f17`). Production smoke test passed on bundle `index-DBDu0oBK.js` at `https://erhakanbanclean0-1.vercel.app/`. All eight alert verb/noun strings confirmed present in the live bundle on 2026-05-13.

### §2.6.4+ / §2.7+ — *TBD*

Remaining sections to be scoped. The original handover identified approximately 30 write surfaces total in the inventory. As of §2.6.3 close, the substantial chunks remaining are likely:

- **RFQ write surfaces.** This is where the `canWriteRFQ` carve-out applies — Dewald (QUOTER) writes only on RFQs assigned to him; FULL tier writes on any RFQ.
- **Procurement board surfaces.** Likely all `canWrite` (FULL only) for the present user set, though Cherise's specific access to Procurement remains TBD.
- **Settings / admin surfaces.** Likely all `canWrite`.
- **Supplier / Client CRUD.** Likely all `canWrite`.
- **Stage-2 sign-off and email-trigger surfaces.** Some are already gated via pre-existing hardcoded checks (see below); some may need migration to the helpers.

**TBD: Len to formalize the section structure and surface inventory for the remainder.**

## Pre-existing role gates (not migrated to helpers)

A small number of role checks predate ADR-009 and use hardcoded role-string comparisons rather than the helper functions. These are functionally correct but inconsistent with the rest of the codebase. They should be migrated to the helpers in a future pass.

- `handleAssign` — `role === 'HENDRIK'`
- `handleSendForManagerApproval` button — `role === 'HENDRIK' || role === 'JUANIC'`
- `LogDeliveryModal` — `canLogDelivery = role === 'CHARLES' || role === 'HENDRIK'`. **Note:** CHARLES is a dormant role in the new tier model, so this gate is functionally HENDRIK-only at present. **TBD: confirm whether CHARLES should be elevated to a tier or the gate should narrow to FULL.**
- PR approve/reject — `canApproveReject = role === 'HENDRIK' && pr.status === 'PENDING_APPROVAL'`
- PO close — `canClose = role === 'HENDRIK' && po.status !== 'CLOSED'`
- Stage 1 e-sign recipient — `hendrik@erha.co.za` hardcoded

## Open questions (status TBD)

The original handover identified four open questions that needed resolution for ADR-009 scope. Their current status as of §2.6.3 close:

1. **CHARLES Log Delivery gate** — see Pre-existing role gates above. **TBD.**
2. **Settings access for Cherise (READER)** — **TBD.** Cherise is read-only by tier definition; the question is whether Settings should be hidden entirely from her view or just write-blocked.
3. **Procurement tab access for Cherise (READER)** — **TBD.** Same shape as Settings — visibility versus write-block.
4. **Dewald's job-level access after the RFQ → Job boundary** — **TBD.** When an RFQ is won and becomes a Job, does Dewald retain any write rights on that Job record, or does QUOTER tier stop at the RFQ boundary?

## Implementation discipline (standing rules)

These standing rules apply to all ADR-009 work and are enforced session-to-session:

- **Audit-first.** No edits before a written surface inventory. The inventory identifies handler name + line, UI element + line, named-handler vs inline, role-in-scope or plumbing needed, and any companion delete or per-item buttons.
- **Row-numbered.** Each surface gets a row number, committed in order. Commit messages reference the row.
- **One commit per row** (or paired rows where surfaces are tightly coupled — e.g. log + delete material).
- **Pipeline per row:** Claude Code investigation → Len confirms → apply → diff review at WebStorm gate → `git diff` review → `npm run build` (typecheck only) → commit → push.
- **Selective git add.** `git add src/App.tsx` only. Pre-existing working-tree clutter (`.bak`, `investigate_*.txt`, patch scripts, `.gitignore` modifications) stays unstaged.
- **No per-commit deploy/verify/tag.** Deploy + smoke + annotated tag are batched at the end of each section.
- **Per-section batch verification:** Vercel deploy → curl bundle and grep for new alert strings → manual UI smoke test across one FULL and one non-FULL account → annotated tag with section commits listed.
- **CMD not PowerShell** for builds. CRLF line endings preserved. `.cjs` scripts for any Node patching.

## Consequences

**Positive:**

- Clear, two-helper-function permission model. New surfaces can be gated by adding two lines (UI wrap + handler guard) without touching central infrastructure.
- Defense-in-depth catches both UI bypass and direct handler invocation.
- Audit-first discipline produces a reviewable plan before any code changes.
- Per-section batch verification gives a clean rollback anchor (one annotated tag per section).
- Migrating new users (or moving an existing user between tiers) is a single-line edit to `TIER_BY_ROLE`.

**Negative / trade-offs:**

- Hardcoded role keys (`'HENDRIK'`, `'DEWALD'`) inside helpers. Adding a new user means a code change + redeploy. Acceptable for Phase 1 (4 active users); not acceptable for Phase 2+, which should move tier membership to a database table.
- Six dormant roles in `VALID_ROLES` create a small ongoing maintenance burden. They should be removed once any historical data referencing them is confirmed irrelevant.
- Pre-existing role gates (`handleAssign`, `LogDeliveryModal`, PR/PO gates, Stage 1 e-sign) bypass the helper functions. Consistency risk. **Follow-up: migrate these to helpers in a future pass.**
- The "visible no-op" pattern on inline inputs (row 22 precedent) is correct but unfriendly — non-FULL users can type into a field and then see their work alerted away. UX polish (`readOnly={!canWrite(role)}` on those inputs) is a separate small follow-up, deferred to keep RBAC scope tight.

## References

- `src/App.tsx` — `TIER_BY_ROLE`, `getTier`, `canWrite`, `canWriteRFQ` (inserted by the helpers patcher)
- Git tag: `phase1-rbac-section-2.6.3-complete` at commit `a220f17`
- Section 2.6.3 commits: `9dad337`, `f383a48`, `7c886e4`, `5eb96f4`, `5ebf800`, `a220f17`
- Production bundle smoke-tested 2026-05-13: `https://erhakanbanclean0-1.vercel.app/assets/index-DBDu0oBK.js`
- Related: ADR-001 through ADR-008 (predecessor decisions, not directly related to RBAC)
