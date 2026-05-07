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

| ADR    | Date       | Status                            | Subject                                                                       | Implementation Tag                                                          |
| ------ | ---------- | --------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 001    | 2026-05-07 | Inferred — Awaiting Confirmation  | US-002 — Parent → child forward-only line item status propagation             | TBD                                                                         |
| 002    | 2026-05-07 | Inferred — Awaiting Confirmation  | US-009 — Suppress auto-generated RFQ reference on printed Direct Job card     | TBD                                                                         |
| 003    | 2026-05-07 | Inferred — Awaiting Confirmation  | Child-row input lockdown and forward-only-no-backfill propagation policy      | `hotfix-jeanic1/2/3/4-*-2026-05-06`                                         |
| 004    | —          | **Reserved**                      | Fast Track bypass feature scope and guardrails *(to be authored)*             | *(post-Phase-2-demo verbal request from Hendrik — already in production)*   |
| 005    | 2026-05-07 | Inferred — Awaiting Confirmation  | Excel parallel run exit criteria *(keystone for Phase 3 commercial conversation)* | N/A — operational policy                                                |

---

## Conventions

- ADRs are numbered sequentially. **Numbers are never reused, even if an ADR is superseded.**
- Numbers can be **reserved** for ADRs that are planned but not yet authored. Reserved entries appear in this index with status `Reserved`.
- File naming: `ADR-NNN-short-slug.md`
- Once an ADR's status changes (e.g. Inferred → Confirmed, or Inferred → Superseded), the change is recorded in the ADR file itself with a dated note, and reflected in this index.
- The Implementation Tag column links the decision to the git tag(s) that shipped the code, so the decision and the artefact are tied. For policy ADRs that have no code artefact (e.g. ADR-005), the column reads `N/A — operational policy`.
- ADRs may be authored prior to implementation (forethought) or retrospectively after implementation has shipped. The retrospective character, when present, is itself documented in the ADR — being explicit about whether a decision was forethought or after-the-fact is part of the audit trail.

---

## Reading Order for First-Time Readers

Anyone reading this register for the first time (e.g. a future PUSH AI engineer, or an ERHA representative reviewing the audit trail) should read in this order:

1. **This INDEX** — for the lay of the land
2. **ADR-005 (Excel exit criteria)** — for the keystone strategic context
3. **ADR-003 (lockdown / forward-only policy)** — for the standing pattern that governs propagation work
4. **ADR-001, ADR-002** — for specific Phase 2 closure decisions

---

*Maintained by Len Klopper / PUSH AI*
*Repo: `erhakanbanclean0.1`*
*Register initialised: 2026-05-07*
