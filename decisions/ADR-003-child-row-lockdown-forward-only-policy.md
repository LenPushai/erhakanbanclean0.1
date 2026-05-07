# ADR-003: Child-Row Input Lockdown and Forward-Only-No-Backfill Propagation Policy

| Field   | Value                                                                                          |
| ------- | ---------------------------------------------------------------------------------------------- |
| Date    | 2026-05-07                                                                                     |
| Status  | **Inferred — Awaiting Confirmation** *(retrospective: code is in production)*                  |
| Author  | Len Klopper / PUSH AI                                                                          |
| User Story | None — cross-cutting policy decision underlying US-J1, US-J2, US-J3, US-J4, and ADR-001    |
| Implementation Tags | `hotfix-jeanic1-contact-add-2026-05-05`, `hotfix-jeanic2-remove-site-requisition-2026-05-05`, `hotfix-jeanic3-delivery-propagation-2026-05-07` *(tagged retroactively; build shipped 2026-05-07 via deploy `dpl_3CuA3wCvLGWSMskiuviBN4eGAqjA`)*, `hotfix-jeanic4-compiled-by-dropdown-2026-05-05` |

---

## Context

Across the four propagation hotfixes shipped on 6 May 2026 (US-J1 through US-J4) and the imminent US-002 build (ADR-001), two cross-cutting design decisions were made implicitly by the implementation team but have not been written down as formal policy. Both decisions extend Jeanic's literal request and need to be documented as deliberate inferences rather than left as undocumented implementation choices.

Jeanic's J-batch list asked for parent line item values to *propagate* to child line items. PUSH AI shipped propagation **plus** two additional design decisions that were not in the literal request:

1. **Child-row input lockdown** — child fields corresponding to a propagated parent value are disabled in the UI, with a tooltip explaining the constraint.
2. **Forward-only with no backfill** — only future updates propagate; existing data is not retroactively synced via blanket UPDATE.

Both decisions have been in production since 6 May 2026 with no defects or user complaints reported. This ADR retrospectively documents the reasoning, raises the open questions for client confirmation, and establishes the policy as the standing pattern for all future propagation work — including ADR-001 (US-002 line item status) and any subsequent parent-child mirror relationships.

---

## Decision

**Decision 1 — Child-row input lockdown.** When a field on a child line item is propagated from its parent, the corresponding input on the child row is disabled in the UI. The standard treatment is:

- `disabled` attribute applied to the input
- `cursor: not-allowed` on hover
- `opacity: 0.5` and a greyed background to signal non-interactivity
- Tooltip on hover reading: *"Set on parent — auto-syncs to children"*

This pattern was first established for the `qc_done` checkbox during Phase 1 and has been applied consistently to every propagated field shipped since.

**Decision 2 — Forward-only with no backfill.** When propagation logic is added or extended, only future updates propagate to children. No retroactive blanket UPDATE is run on existing parent / child data. Pre-existing discrepancies are addressed case-by-case as Jeanic or workshop staff identify them, not via a one-shot data fix.

This policy applies to all propagation work currently in production (US-J1 through US-J4, qc_done) and is extended forward to cover ADR-001 (US-002 status propagation) and any future parent-child mirror field added to the system.

---

## Reasoning

### On the child-row input lockdown

**1. Single source of truth.** Without the lock, a workshop user could edit a child row directly. The next parent-side update would either silently overwrite that child edit (loss of work) or — in a non-propagating moment — create a divergence between parent and child that the database would happily persist. Either outcome erodes the parent-as-source-of-truth model that the entire Workshop Board is built on.

**2. UX clarity.** A locked input with a clear tooltip is more discoverable than a non-obvious "your edit was just overwritten" experience. The user immediately understands why the field is non-interactive and where to make the change.

**3. Pattern consistency.** The `qc_done` checkbox established this pattern in Phase 1. Replicating it on every propagated field gives ERHA users a single, predictable interaction model: *"if it's set on the parent, it's locked on the child, and the tooltip tells me so."*

**4. Defensive programming for the parallel run period.** During parallel run, ERHA staff are operating two systems simultaneously and may make exploratory edits to the new system. Locked fields prevent accidental drift between the system and Excel during this fragile period.

### On forward-only with no backfill

**1. Production data risk.** Blanket `UPDATE` statements on production tables — particularly during a parallel run where Excel remains the canonical reference — carry a very real risk of corrupting historical records or creating discrepancies that take days to untangle. Forward-only propagation is reversible by simply removing the propagation handler; a blanket UPDATE is not reversible without a backup-and-restore cycle.

**2. Operator visibility.** Case-by-case alignment lets Jeanic or the relevant operator review each correction before it's applied. A blanket UPDATE happens silently and can mask data quality issues that the operator might otherwise notice.

**3. Established discipline across J-batch.** The pattern was set explicitly in the J3 deployment conversation: *"Match US-002 forward-only pattern. If Jeanic's existing line items lack values that should cascade, we can address case-by-case rather than running a blanket UPDATE."* Codifying this as standing policy means future propagation work doesn't re-litigate the question.

**4. Smaller blast radius.** If the propagation logic itself has a bug (wrong direction, wrong field, malformed value), forward-only contains the damage to records edited after the bug shipped. A blanket UPDATE applies the bug to every existing record at once.

---

## Evidence

- **US-J1 through US-J4** (tagged 6 May 2026) — All four hotfixes implement child-row lockdown and forward-only propagation. All in production with zero defects reported as at the date of this ADR.
- **`qc_done` existing implementation** — Established the locked-child-input pattern in Phase 1. In production since Phase 1 sign-off (8 April 2026) with no operational pushback.
- **J3 deployment record (6 May 2026)** — Explicit verbal decision in the deployment conversation: *"Backfill: SKIP. Match US-002 forward-only pattern. Consistent with the established propagation discipline."*
- **Phase 1 sign-off (8 April 2026)** — Implicit acceptance of the parent-as-source-of-truth architecture by the client.
- **Absence of contrary signal** — No request from Jeanic, Hendrik, Cherise, Dewald, or workshop floor staff to (a) unlock child inputs or (b) backfill existing data.

---

## Risk if Wrong

### On the child-row lockdown

If ERHA's workshop staff in fact need to override propagated values on a child row for legitimate operational reasons — for example, a child job ships separately with a different delivery note than the rest of the parent's children — the current lockdown blocks that workflow. They would need to either (a) push the override request to ops via WhatsApp / phone, breaking workflow, or (b) request an unlock pattern (e.g. a per-row override toggle, or a manager-only override permission), which is a fresh ADR.

### On forward-only no-backfill

If pre-existing discrepancies in parent / child data accumulate without ever being cleaned up, two classes of records develop in the database: pre-policy (potentially divergent) and post-policy (always synced). Downstream analytics, reporting, and ML features that bin by these fields will need to handle both classes correctly — adding complexity to every downstream consumer of the data. The longer the policy runs without cleanup, the larger the pre-policy class grows.

### Cumulative risk

Both decisions are individually conservative and reversible. The risk profile is asymmetric: the worst case if we're wrong is a future workflow request that we accommodate with a fresh ADR. The worst case if we'd done the opposite (no lockdown, blanket backfill) would have been data corruption during the parallel run, which is materially more damaging.

---

## Reversal Plan

### Reversing the child-row lockdown (per field)

1. Identify the input element(s) on the child row for the field in question.
2. Remove the `disabled` attribute, the styling guards, and the tooltip.
3. Decide whether the propagation handler should still write to children when a child is independently edited (likely yes — last-write-wins on the child until a parent-side update overwrites it; or no — once a child is touched, it becomes "detached" and propagation skips it).
4. If "detached" semantics are required, add a `child_overridden` boolean column or equivalent flag and update the propagation handler to respect it.
5. Author successor ADR documenting the unlock pattern. Mark this ADR as **Superseded by ADR-NNN**.
6. Estimated effort: 1 dev day if simple unlock; 2–3 dev days if "detached" semantics required.

### Reversing forward-only no-backfill

1. Identify the field(s) requiring backfill.
2. Author a one-shot SQL migration script with explicit pre-migration count, expected rows affected, and post-migration verification query.
3. Take a database backup before running.
4. Run the migration in a transaction, verify the result, commit or rollback.
5. Author successor ADR documenting the backfill (one-shot, dated, scoped to specific fields). This does not necessarily supersede ADR-003 in full; it can be a one-off exception explicitly carved out.
6. Estimated effort: 0.5–1 dev day per field, with extra time for verification and stakeholder sign-off before running.

---

## Standing Policy

Going forward, **all parent-child mirror field implementations** in the ERHA system follow this policy by default:

1. The child-row input for the propagated field is locked using the standard treatment.
2. Propagation is forward-only; no blanket backfill of existing data.

Deviations from this policy require an ADR explicitly justifying the deviation.

---

## Open Questions for Client Confirmation

When this ADR is presented to Jeanic / Hendrik for ratification, the following confirmations close it:

1. Is the locked-child-input pattern (with the *"Set on parent — auto-syncs to children"* tooltip) acceptable as the standing UX pattern for all parent-child mirror fields, or are there scenarios where the workshop floor needs to override on the child?
2. For pre-existing data discrepancies in parent / child records (records created before the propagation logic shipped), is case-by-case resolution acceptable, or do you want a one-shot backfill exercise on specific fields?
3. Should the standing policy in this ADR be referenced explicitly in future feature specs as the default behaviour, so that user stories don't need to re-state the propagation pattern each time?

A "yes" to questions 1 and 3, plus a clear answer to question 2 (which fields if any to backfill), will move this ADR's status from **Inferred** to **Confirmed**.

---

*This ADR was authored on 2026-05-07 retrospectively. The decisions documented here have been in production since 2026-05-06 across US-J1 through US-J4. The retrospective character is itself part of the audit trail: it documents that the policy was made explicit and presented for ratification within 24 hours of the implementations shipping.*
