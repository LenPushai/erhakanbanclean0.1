# ERHA Decision Register

This register tracks calculated decisions made on the ERHA Fabrication & Construction Kanban Operations Management System where formal client requirements were absent or ambiguous, and a defensible inference was made by the implementation team to enable forward progress.

Each Architecture Decision Record (ADR) carries a **Status** field with three possible values:

- **Inferred — Awaiting Confirmation** — Shipped on a calculated inference. Awaiting written client sign-off (Jeanic / Hendrik).
- **Confirmed** — Client has formally acknowledged the decision in writing.
- **Superseded** — Replaced by a newer ADR. Link to successor in the Status line.

The register exists to ensure that any operational decision made on the client's behalf is documented, defensible, and reversible. When the client later asks "why did you build it this way?" the answer is a timestamped document showing the reasoning, the evidence base, the risk if wrong, and the reversal path.

---

## Register

| ADR    | Date       | Status                            | Subject                                                                       | Implementation Tag |
| ------ | ---------- | --------------------------------- | ----------------------------------------------------------------------------- | ------------------ |
| 001    | 2026-05-07 | Inferred — Awaiting Confirmation  | US-002 — Parent → child forward-only line item status propagation             | TBD                |
| 002    | 2026-05-07 | Inferred — Awaiting Confirmation  | US-009 — Suppress auto-generated RFQ reference on printed Direct Job card     | TBD                |

---

## Conventions

- ADRs are numbered sequentially. Numbers are never reused, even if an ADR is superseded.
- File naming: `ADR-NNN-short-slug.md`
- Once an ADR's status changes (e.g. Inferred → Confirmed, or Inferred → Superseded), the change is recorded in the ADR file itself with a dated note, and reflected in this index.
- Implementation tag column links the decision to the git tag that shipped the code, so the decision and the artefact are tied.

---

*Maintained by Len Klopper / PUSH AI*
*Repo: `erhakanbanclean0.1`*
