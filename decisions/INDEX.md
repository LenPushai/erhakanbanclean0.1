# ERHA Decision Register

This register tracks calculated decisions made on the ERHA Fabrication & Construction Kanban Operations Management System where formal client requirements were absent or ambiguous, and a defensible inference was made by the implementation team to enable forward progress.

Each Architecture Decision Record (ADR) carries a **Status** field with the following possible values:

- **Inferred — Awaiting Confirmation** — Shipped on a calculated inference. Awaiting written client sign-off (Jeanic / Hendrik).
- **Confirmed** — Client has formally acknowledged the decision in writing.
- **Superseded** — Replaced by a newer ADR. Link to successor in the Status line.
- **Reserved** — Number reserved for a planned future ADR. Not yet authored.

The register exists to ensure that any operational decision made on the client's behalf is documented, defensible, and reversible. When the client later asks "why did you build it this way?" the answer is a timestamped document showing the reasoning, the evidence base, the risk if wrong, and the reversal path.

---

## Register

| ADR    | Date       | Status                            | Subject                                                                       | Implementation Tag                                                              |
| ------ | ---------- | --------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 001    | 2026-05-07 | Inferred — Awaiting Confirmation  | US-002 — Parent → child forward-only line item status propagation             | TBD                                                                             |
| 002    | 2026-05-07 | Inferred — Awaiting Confirmation  | US-009 — Suppress auto-generated RFQ reference on printed Direct Job card     | `us-009-job-card-rfq-suppression-2026-05-07`                                    |
| 003    | 2026-05-07 | Inferred — Awaiting Confirmation  | Child-row input lockdown and forward-only-no-backfill propagation policy      | `hotfix-jeanic1-contact-add-2026-05-05`, `hotfix-jeanic2-remove-site-requisition-2026-05-05`, `hotfix-jeanic3-delivery-propagation-2026-05-07`, `hotfix-jeanic4-compiled-by-dropdown-2026-05-05` |
| 004    | —          | **Reserved**                      | Fast Track bypass feature scope and guardrails *(to be authored)*             | *(post-Phase-2-demo verbal request from Hendrik — already in production)*       |
| 005    | 2026-05-07 | Inferred — Awaiting Confirmation  | Excel parallel run exit criteria *(keystone for Phase 3 commercial conversation)* | N/A — operational policy                                                    |
| 006    | 2026-05-08 | Inferred — Awaiting Confirmation  | E-Signature — Built-in two-stage workflow over third-party (DocuSign deferred) | TBD (target: 8–9 May 2026)                                                     |
| 007    | 2026-05-07 | Inferred — Awaiting Confirmation  | Executive Operational Dashboard *(v1 scope; build window 12–13 May 2026)*    | TBD                                                                             |
| 008    | 2026-05-08 | Inferred — Awaiting Confirmation  | RBAC — Phase 1 single-role model *(Monday user go-live keystone)*             | TBD                                                                             |

---

## Conventions

- ADRs are numbered sequentially. **Numbers are never reused, even if an ADR is superseded.**
- Numbers can be **reserved** for ADRs that are planned but not yet authored. Reserved entries appear in this index with status `Reserved`.
- File naming: `ADR-NNN-short-slug.md`
- Once an ADR's status changes (e.g. Inferred → Confirmed, or Inferred → Superseded), the change is recorded in the ADR file itself with a dated note, and reflected in this index.
- The Implementation Tag column links the decision to the git tag(s) that shipped the code. For policy ADRs that have no code artefact (e.g. ADR-005), the column reads `N/A — operational policy`. For Reserved ADRs, the column carries a brief note about the source of the deferred decision.
- ADRs may be authored prior to implementation (forethought) or retrospectively after implementation has shipped. The retrospective character, when present, is itself documented in the ADR.
- ADRs may be tight or comprehensive depending on urgency. Tighter ADRs (one-page) are valid when speed matters; comprehensive ADRs (10+ pages) are valid for keystone decisions. The audit trail value is the same; the ceremony differs.

---

## Reading Order for First-Time Readers

Anyone reading this register for the first time (e.g. a future PUSH AI engineer, or an ERHA representative reviewing the audit trail) should read in this order:

1. **This INDEX** — for the lay of the land
2. **ADR-005 (Excel exit criteria)** — for the keystone strategic context
3. **ADR-007 (Executive Operational Dashboard)** — for the second pillar of the Phase 3 commercial conversation
4. **ADR-008 (RBAC role definitions)** — for the access control matrix
5. **ADR-006 (E-Sign two-stage workflow)** — for the signature mechanism that completes Phase 1
6. **ADR-003 (lockdown / forward-only policy)** — for the standing pattern that governs propagation work
7. **ADR-001, ADR-002** — for specific Phase 2 closure decisions

ADR-004 remains a reserved placeholder to be authored when the Fast Track scope writeup work cycle comes up (the feature itself already shipped in production after the Phase 2 demo).

---

*Maintained by Len Klopper / PUSH AI*
*Repo: `erhakanbanclean0.1`*
*Register initialised: 2026-05-07*
