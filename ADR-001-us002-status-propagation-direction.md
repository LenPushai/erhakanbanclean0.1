# ADR-001: US-002 — Parent → Child Forward-Only Line Item Status Propagation

| Field   | Value                                                                                          |
| ------- | ---------------------------------------------------------------------------------------------- |
| Date    | 2026-05-07                                                                                     |
| Status  | **Inferred — Awaiting Confirmation**                                                           |
| Author  | Len Klopper / PUSH AI                                                                          |
| User Story | US-002 (Phase 2 UAT, raised ~23 April 2026)                                                |
| Implementation Tag | TBD (will follow pattern `us-002-status-propagation-2026-05-07`)                  |

---

## Context

ERHA's Workshop Board operates on a parent / child job structure. A parent job (e.g. `JOB-FC26-0026`) can spawn child jobs (e.g. `-A`, `-B`, `-C`) that are assigned to specific workshop teams or delivery batches. Line items on the parent are mirrored onto the children via a `parent_line_item_id` foreign key relationship.

Each line item carries a `status` field tracking workflow progression (e.g. `pending`, `in_progress`, `ready`, `dispatched`).

US-002 was raised in the Phase 2 UAT on or around 23 April 2026, requesting that line item status be synchronised between parent and child. The user story was deferred from the late-April sprint because the spec did not specify the **direction** of the sync — parent → child (cascade), child → parent (rollup), or bidirectional. Without that clarification, implementation could not safely proceed.

Multiple touchpoints with Jeanic (PA / Operations System Manager, `pa@erha.co.za`) over the subsequent two weeks did not produce written clarification on the direction. Phase 2 sign-off is gated on closure of US-002 (and US-009). Continued indefinite deferral is therefore a project risk.

This ADR documents the inferred decision being made on the client's behalf to unblock Phase 2 closure, the reasoning behind it, and the path to reverse the decision if the inference proves incorrect.

---

## Decision

Implement **parent → child forward-only propagation** for line item status, following the propagation pattern established by US-J1 through US-J4 (delivered 6 May 2026).

Specifically:

1. When a parent line item's `status` field is updated, propagate the new value to all child line items linked via `parent_line_item_id`.
2. Disable the `status` field on child line items in the UI. Apply the standard locked-input treatment: `disabled` attribute, `cursor: not-allowed`, `opacity: 0.5`, greyed background, and a tooltip reading: *"Set on parent — auto-syncs to children"*.
3. Write a `line_item_status_propagated` event to the `activity_log` table on each propagation, capturing parent line item ID, child IDs affected, old status, new status, and timestamp. This satisfies the PUSH AI ML-first architecture principle (event logging for future inference).
4. Migration: existing line items are not retroactively synced. Forward-only propagation aligns with the established US-002 / US-J3 pattern of not running blanket UPDATEs on existing data; case-by-case alignment can be handled manually if Jeanic flags specific records.

---

## Reasoning

**1. Operational consistency.** ERHA's emergent operational model — observable through four shipped propagation hotfixes this week (J1 through J4) — treats the parent line item as the single source of truth for line-item-level metadata. The `qc_done` checkbox already propagates parent → child. The `delivery_number` and `delivery_date` fields now do too (US-J3, tagged `hotfix-jeanic3-delivery-propagation-2026-05-06`). Status is the obvious next member of that family. A mixed model — where some fields cascade and others roll up — would create a confusing two-mode experience for operators and is unlikely to be what ERHA intended.

**2. User mental model.** Workshop teams interact with child jobs as discrete work assignments; operations and admin staff interact with the parent as the master record. This split implies that data entry should happen at the parent level (where ops sit) and propagate down to where workshop staff see it, not the reverse.

**3. Implementation symmetry.** The propagation pattern has been shipped four times this week with no production defects reported. The pattern is well-understood, the test surface is known, and the rollback discipline (backup → patch → build → deploy → smoke → commit → tag) is rehearsed. Reusing the pattern minimises both build risk and time to delivery.

**4. ML readiness.** Writing a `line_item_status_propagated` event into `activity_log` gives the PUSH AI ML layer future signal on operational tempo (how quickly parent statuses are advanced, which children lag behind expectation, etc.) without requiring application-level changes later. This satisfies PUSH AI's ML-first architecture principle.

**5. Reversibility.** Forward-only propagation is the simpler of the available directions to invert. Bidirectional or child → parent rollup would entail aggregation logic, conflict resolution, and database trigger considerations that are costly to back out. Parent → child can be neutralised in a single patch by removing the propagation handler and re-enabling the child input. See *Reversal Plan* below.

---

## Evidence

- **US-J1, US-J2, US-J3, US-J4** — All four hotfixes shipped 6 May 2026 use parent → child forward-only propagation. All are in production with no defects reported as at the date of this ADR. Tag references: `hotfix-jeanic1-*-2026-05-06` through `hotfix-jeanic4-*-2026-05-06`.
- **`qc_done` existing implementation** — Established parent → child pattern, in production since Phase 1 sign-off (8 April 2026). No pushback from ERHA users on this pattern in the parallel run period.
- **Absence of contrary evidence** — No verbal or written request from Jeanic, Hendrik, Cherise, Dewald, or workshop floor staff for child → parent rollup of status. Ambiguity has been about *whether* to sync, not the direction of the sync per se.
- **Phase 1 sign-off (8 April 2026)** — formal client acceptance of the system architecture, including the parent / child mirror structure as currently implemented.

---

## Risk if Wrong

If ERHA in fact require workshop-driven status (i.e. the workshop floor marks a line item `ready` on a child, and operations need to see that bubble up to the parent), the implementation in this ADR will block that workflow. Workshop staff would either:

(a) Need to communicate status via an out-of-band channel (radio, WhatsApp, walking to the office) and have ops manually update the parent — breaking the single-source-of-truth principle and creating a sync gap.

(b) Request inversion to child → parent or bidirectional, which would require a fresh ADR (ADR-NNN), schema review, conflict-resolution logic, and a full sprint. Estimate: 2–3 dev days plus regression testing across all four currently shipped propagation fields.

The financial / commercial risk is low because the system remains usable in degraded mode (option a) while the inversion is planned.

The reputational risk is moderate: shipping the wrong direction signals that PUSH AI did not adequately consult the client, which this ADR explicitly mitigates by being a transparent record of the inference.

---

## Reversal Plan

Should this ADR be marked Superseded:

1. Identify the propagating handler (likely `handleStatusField` or equivalent in `src/App.tsx`) and the child input lock guards.
2. Replace the propagating handler with a non-propagating version (writes only the row that was edited).
3. Remove the `disabled` attribute and tooltip from the child status input.
4. No data migration required: existing data remains valid under either direction.
5. Author successor ADR (e.g. ADR-NNN) documenting the new direction and link from this ADR's Status line, marking ADR-001 as **Superseded by ADR-NNN**.
6. Update `INDEX.md`.
7. Estimated effort: 1 dev day inclusive of build, deploy, smoke test on test data (e.g. JOB-FC26-0026 with children -A/-B/-C), commit, and tag.

---

## Open Questions for Client Confirmation

When this ADR is presented to Jeanic / Hendrik for ratification, the following confirmations close it:

1. Is parent → child the correct direction for line item status propagation, or should workshop-driven status flow upward to the parent?
2. If parent → child is correct, are there any line item status values that should be exempt from propagation (e.g. a workshop-only `quality_hold` status)?
3. Is the locked child-input pattern (with the *"Set on parent — auto-syncs to children"* tooltip) acceptable, or would Jeanic prefer an alternate UX (e.g. a read-only badge instead of a disabled input)?

A "yes" to question 1, plus answers to 2 and 3, will move this ADR's status from **Inferred** to **Confirmed**.

---

*This ADR was authored on 2026-05-07 prior to implementation. It documents the reasoning leading into a build, not after it.*
