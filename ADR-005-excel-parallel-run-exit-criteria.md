# ADR-005: Excel Parallel Run Exit Criteria

| Field   | Value                                                                                          |
| ------- | ---------------------------------------------------------------------------------------------- |
| Date    | 2026-05-07                                                                                     |
| Status  | **Inferred — Awaiting Confirmation**                                                           |
| Author  | Len Klopper / PUSH AI                                                                          |
| User Story | None — operational policy / commercial gating decision                                     |
| Implementation Reference | N/A — operational policy, not a code artefact                                   |

---

## Context

Phase 1 of the ERHA Kanban Operations Management System was formally signed off on 8 April 2026 and has been running in production parallel with the legacy Excel-based operations management since that date. Phase 2 was demoed and accepted, with verbal go-ahead from Hendrik to continue. Phase 3 scoping has begun (Procurement module, Internal Store, ML Intelligence Layer), but the formal commercial conversation with Hendrik on Phase 2 / 3 scope and terms has been deliberately deferred until *"the Excel parallel run concludes and the system is the single source of truth."*

That deferral is rational. It is also indefinite. There is currently no written, agreed-upon definition of:

- What "the Excel parallel run concludes" means in operational terms
- What signals would constitute green light for retiring Excel
- Who has authority to declare the Excel sunset
- What a graceful sunset actually looks like (read-only fallback period, signed declaration, etc.)

Without an explicit exit rubric, the parallel run drifts as a perpetual condition rather than a defined transition. Each week that passes without an exit gate is another week of:

- PUSH AI carrying unbillable consulting time on dual-system support
- ERHA staff operating two systems and reconciling between them
- The Phase 3 commercial conversation remaining indefinitely deferred
- The ML Intelligence Layer (which depends on the system being the canonical source of truth) being unable to begin

This ADR documents the inferred call PUSH AI is making on ERHA's behalf to crystallise the exit criteria into something defensible, negotiable, and verifiable. It is presented to the client for ratification.

---

## Decision

Establish a **three-condition exit gate**. All three conditions must be satisfied for Excel to be formally retired:

### Condition 1 — Data Parity

Thirty (30) consecutive operational days during which the system-generated reports match the equivalent Excel reports to within the agreed tolerance.

The canonical reports (proposed; to be confirmed with Jeanic) are:

- RFQ Register — count and content of RFQs, by status, for the period
- Job Register — count and content of jobs, by status and board, for the period
- Delivery Register — line items dispatched and delivered, with delivery numbers and dates
- Financial Summary — quote values, invoice values, and aggregated job financials for the period

The agreed tolerance (proposed; to be confirmed):

- Counts: zero discrepancy
- Financial figures: 0.5% or R 100 per record, whichever is greater (covers rounding and formula differences)
- Status fields: zero discrepancy

Any single day on which the discrepancy exceeds tolerance resets the 30-day clock.

### Condition 2 — User Confidence

For thirty (30) consecutive operational days, all key user roles use the system as their primary tool for daily operations and do not fall back to Excel for the operational decisions that the system is intended to support.

The key user roles (proposed):

- Hendrik (CEO / MD)
- Jeanic (PA / Operations System Manager)
- Cherise (Admin)
- Dewald (Quoting)
- At least one workshop floor representative

"Falling back" is defined as opening the Excel file as the source of truth for any operational decision (creating a new RFQ, scheduling a job, recording a dispatch, generating a customer document, etc.). Read-only inspection of Excel for historical lookup is permitted and does not count as a fallback.

Any documented fallback during the 30-day window resets the clock.

### Condition 3 — Operational Coverage

Every workflow currently performed in Excel has a verified equivalent in the system, demonstrated end-to-end at least three (3) times per workflow, including the following edge cases:

- Direct Jobs (no upstream RFQ)
- Fast Track jobs (using the amber bypass feature)
- Multi-child jobs (parent with multiple children, including propagation behaviour)
- Cancelled jobs and revised RFQs
- Direct customer reference data and walk-ins

A workflow coverage matrix is maintained jointly by PUSH AI and Jeanic, with sign-off on each workflow as it is verified.

### Sunset Procedure

When all three conditions are satisfied, formal Excel sunset is scheduled:

1. **Two-week notice period** — written notice to all ERHA staff that Excel will move to read-only on a specific date.
2. **Read-only retention for 90 days** — the Excel files remain accessible read-only for historical lookups during a 90-day stabilisation window. No edits or new entries.
3. **Single source of truth declaration** — signed by Hendrik (and countersigned by Jeanic), formally acknowledging that the system is now the canonical operational record.
4. **Final archive** — at the 90-day mark, the Excel files are archived to a designated location (cloud storage, dated, read-only) and removed from the daily-access shared drive.

---

## Reasoning

**1. Indefiniteness is the worst outcome.** Without an explicit gate, the parallel run never ends. ERHA carries dual-system overhead indefinitely. PUSH AI carries unbillable consulting time. The Phase 3 conversation never starts. An imperfect rubric that gets ratified is materially better than a perfect rubric that sits in someone's head.

**2. Three conditions cover the three failure modes.** Production cutovers fail in three distinct ways: data drift (the new system silently disagrees with the canonical source), user resistance (people don't trust it and quietly keep using the old system), and process gaps (the new system can't handle a workflow that the old one did). Each condition addresses one failure mode. All three together give comprehensive coverage.

**3. Thirty-day windows are standard practice.** Enterprise system cutover validation typically uses 30-day parallel-run windows. Long enough to surface monthly cycles (financial close, payroll-adjacent reporting, etc.) and short enough to maintain momentum. Shorter windows (one or two weeks) miss monthly events. Longer windows (60 or 90 days) defer indefinitely.

**4. Tolerance is necessary on financial figures.** Excel and database systems disagree at the rounding-error level constantly — different rounding modes, different floating-point handling, different calculation orders. A zero-tolerance rubric on financial parity sets ERHA up for endless reconciliation chasing immaterial differences. A small explicit tolerance lets the team focus on material discrepancies.

**5. Read-only retention mitigates the "we forgot to check X" risk.** A common cutover failure mode is discovering, two weeks after the old system is turned off, that there was a quarterly report nobody thought to validate. Ninety days of read-only access lets that discovery happen without panic.

**6. Hendrik's signature crystallises the agreement.** Verbal agreement that the system is the source of truth is forgettable; a signed declaration is not. The signature is the formal commercial moment that converts the parallel run from "ongoing trial" to "completed implementation," which is the prerequisite for the Phase 3 commercial conversation.

**7. The criteria are negotiable but the structure is sound.** Specific numbers (30 days, 0.5%, 90 days read-only) can be tightened or relaxed by the client without breaking the logic of the framework. The three-condition structure itself is the load-bearing element.

---

## Evidence

- **Industry practice** — 30-day parallel-run windows are standard in enterprise system cutover playbooks (Prosci, Gartner cutover frameworks, mainstream ERP migration guidance).
- **ERHA's stated business posture** — Hendrik's verbal feedback in late April 2026 indicated that Excel must continue until ERHA is confident in the system. This ADR is the formalisation of "until ERHA is confident" into testable criteria.
- **Phase 1 sign-off (8 April 2026)** — Establishes the system as functionally complete to a defined scope; the parallel run is the validation step that follows.
- **Phase 2 demo acceptance** — Phase 2 functionality is in production and accepted; the parallel run has not surfaced systemic issues that would require backing out.
- **Absence of competing rubric** — No alternative exit criteria have been proposed by ERHA. This ADR fills that gap on the client's behalf.

---

## Risk if Wrong

### Criteria too strict

If the criteria are tighter than ERHA's actual readiness, Excel never gets retired and the project enters indefinite parallel-run mode. PUSH AI continues to carry dual-system overhead with no commercial recognition. The Phase 3 conversation continues to defer. The ML Intelligence Layer — which depends on a clean canonical source — cannot start.

Mitigation: any of the three conditions can be relaxed by amendment ADR if the parallel run reveals that the criteria are unrealistic in practice.

### Criteria too lax

If the criteria are looser than ERHA's actual readiness, Excel gets retired before users and processes are ready. The system gets blamed for issues that Excel was quietly absorbing. Trust is damaged. ERHA reverts to Excel and the parallel run effectively restarts, with a worse trust posture than before.

Mitigation: the 90-day read-only retention is itself a soft-reversal mechanism. If issues surface after sunset, Excel is still available as a reference for the 90-day window.

### Criteria not ratified

The most likely failure mode is that ERHA does not formally ratify these criteria, and the parallel run continues without a defined exit. This ADR's existence does not by itself solve the problem; it creates the document around which the conversation can happen. The follow-up — booking a meeting with Hendrik and Jeanic to walk through this ADR and either ratify or amend it — is the action that converts ADR-005 from policy on paper to operational reality.

---

## Reversal Plan

If, after ratification, the criteria prove unworkable in practice:

1. Document the specific failure mode (e.g. "30-day parity window keeps resetting due to a non-material report discrepancy" or "user fallback is happening for a workflow we hadn't realised was missing").
2. Author successor ADR (ADR-NNN) amending the specific condition that's failing. Do not author a wholesale replacement — amend only what's broken.
3. Mark this ADR as **Superseded by ADR-NNN** with a brief note describing what was amended and why.
4. Update `INDEX.md`.
5. Estimated effort: amendment ADR is half a dev day of writing plus the time to re-walk the change with Hendrik and Jeanic.

---

## Open Questions for Client Confirmation

When this ADR is presented to Hendrik and Jeanic for ratification, the following confirmations close it:

1. Do the three conditions (data parity, user confidence, operational coverage) match your sense of what "ready to turn off Excel" means for ERHA? If not, what's missing or wrong?
2. What is the canonical list of reports that need to match for the data parity condition? My proposal: RFQ Register, Job Register, Delivery Register, Financial Summary. Are there others (e.g. workshop schedule, payroll-adjacent, customer statement) that should be included?
3. Is the proposed financial tolerance (0.5% or R 100 per record, whichever is greater; zero on counts and status fields) acceptable, or should we tighten or relax it?
4. Is 30 consecutive days the right window for both Condition 1 (data parity) and Condition 2 (user confidence), or should those windows differ?
5. Who are the named user roles for Condition 2? My proposal: Hendrik, Jeanic, Cherise, Dewald, plus a workshop representative. Is that complete?
6. Is the 90-day read-only retention period acceptable, or do you want longer (or shorter)?
7. Who signs the sunset declaration? My proposal: Hendrik signs, Jeanic countersigns. Is that the right authority structure for ERHA?

A "yes" to question 1 in principle, plus answers to 2 through 7 (which can be quick — most are sentence-length confirmations or amendments), will move this ADR's status from **Inferred** to **Confirmed**, and converts it into the formal exit rubric for the parallel run.

---

## Strategic Note

This ADR is the keystone document for the deferred commercial conversation with Hendrik on Phase 2 / 3 scope and terms. Bringing this to Hendrik with a draft three-condition rubric reframes the conversation from *"when do we turn off Excel?"* (open-ended, anxiety-inducing) to *"do these specific conditions match your readiness?"* (concrete, negotiable, time-bounded).

Recommended path: present this ADR to Jeanic first for operational sanity-check on the report list, tolerances, and user roles. Once Jeanic has weighed in, take the operationally-validated version to Hendrik for commercial ratification, paired with the Phase 3 scope conversation that has been waiting on this gate.

---

*This ADR was authored on 2026-05-07 prior to ratification, as a draft rubric for client review. It does not yet represent agreed policy; it represents PUSH AI's best estimate of the exit criteria that ERHA would set if asked, presented for confirmation or amendment.*
