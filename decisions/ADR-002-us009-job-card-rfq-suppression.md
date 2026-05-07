# ADR-002: US-009 — Suppress Auto-Generated RFQ Reference on Printed Direct Job Cards

| Field   | Value                                                                                          |
| ------- | ---------------------------------------------------------------------------------------------- |
| Date    | 2026-05-07                                                                                     |
| Status  | **Inferred — Awaiting Confirmation**                                                           |
| Author  | Len Klopper / PUSH AI                                                                          |
| User Story | US-009 (Phase 2 UAT, raised ~23 April 2026)                                                |
| Implementation Tag | `us-009-job-card-rfq-suppression-2026-05-07`                                       |

---

## Context

ERHA jobs originate from one of two paths:

1. **RFQ workflow path** — `RFQ → Quote → Order → Job`. The job carries a real customer-supplied RFQ reference.
2. **Direct Job path** — created without an upstream RFQ (e.g. walk-in customer, repeat work, internal request). The job receives an auto-generated reference value to satisfy the database not-null constraint on the RFQ reference column.

The printed job card — a PDF / print template handed to customers, workshop staff, or filed for records — currently renders the RFQ reference field uniformly across both job types. For Direct Jobs, this means a synthetic / placeholder value (likely formatted as `AUTO-XXX` or similar) is being printed and presented as if it were a customer-supplied reference. This is professionally inappropriate when the printed card is given to the customer, because it implies an RFQ exchange that never took place.

US-009 was raised in the Phase 2 UAT on or around 23 April 2026 requesting that this auto-generated reference be removed from the printed job card. The user story was deferred from the late-April sprint without explicit reasoning recorded.

There is a credible possibility that US-009 has already been resolved as a side effect of US-005 (*Direct Job customer RFQ ref*, tagged `us-005-complete` on 23 April 2026), which addressed the data layer treatment of Direct Job RFQ references. Whether US-005 also touched the print template is not currently established and forms part of the verification step in this ADR.

This ADR documents the inferred decision being made on the client's behalf to close out US-009 and unblock Phase 2 sign-off.

---

## Decision

Audit the printed job card template. Then apply one of two outcomes depending on the audit result:

**Outcome A — Verification only (no-op).** If the print template already conditionally suppresses the RFQ reference for Direct Jobs (likely as a side effect of US-005), no code change is required. Verify by printing a Direct Job and an RFQ-originated Job side by side. Tag and close.

**Outcome B — Suppress the RFQ reference line for Direct Jobs.** If the print template currently renders the auto-generated reference, modify the template to conditionally hide the entire RFQ reference line (label and value together, not just blank the value) when the value is auto-generated. Render normally when the reference is a real customer-supplied value originating from the RFQ workflow.

The decision rule for "auto-generated" can be implemented either by:

(a) checking a boolean flag (e.g. `is_auto_rfq_ref`) if such a flag exists in the data model, or

(b) detecting the auto-generated prefix pattern (e.g. value matches `^AUTO-`), or

(c) checking whether the job has an associated RFQ row in the `rfqs` table (Direct Jobs would not).

The implementation will choose whichever check is most reliable based on the audit findings.

---

## Reasoning

**1. Customer-facing artefact.** The printed job card is given to the customer as part of the job documentation. Showing a placeholder reference such as `AUTO-XXX` implies an RFQ exchange that did not occur, which is professionally inappropriate and undermines the customer's trust in the documentation. Removing the reference for Direct Jobs aligns the printed artefact with the actual business reality.

**2. Suppression vs blanking.** Hiding the entire line (label and value together) is cleaner than rendering "RFQ Ref: " with an empty value, which still draws attention to a missing field and looks like a data quality issue. Suppressing the line entirely produces a cleanly formatted card that does not reference an absent RFQ.

**3. Minimal surface change.** This is a presentation-layer change. No data migration. No schema change. No propagation logic. The riskiest outcome is a layout regression on the print template, which is straightforward to verify with two test prints (one Direct Job, one RFQ-originated Job).

**4. Possible no-op via US-005.** US-005 addressed Direct Job RFQ reference handling at the data layer. There is a credible chance that the print template already behaves correctly as a side effect of that change. Verification is the cheapest first move.

---

## Evidence

- **US-005 (`us-005-complete`, tagged 23 April 2026)** — addressed Direct Job customer RFQ reference handling at the data layer.
- **Phase 1 production parallel run** — Has not surfaced specific customer complaints about printed job card RFQ references. This is weak evidence: customers may not have noticed, may not have flagged it directly to ERHA, or may have flagged it to ERHA who then absorbed it without forwarding to PUSH AI.
- **No written specification from Jeanic** on the desired print behaviour. The ambiguity has been about whether US-009 is already closed by US-005 or still requires explicit work.

---

## Risk if Wrong

If ERHA in fact wanted the auto-generated reference to remain visible — perhaps as an internal tracking ID for ops staff to cross-reference with the workshop scheduling spreadsheet — this change would remove information that ops were relying on.

Mitigation: The auto-generated reference remains in the database. It is only suppressed on the printed customer-facing artefact. A future template change can re-introduce the field as an internal-only stamp on the card (e.g. small grey footer text rather than a prominent labelled field) if requested by the client.

The financial / commercial risk is negligible. The reputational risk is low because the change is reversible in a single line of code.

---

## Reversal Plan

Should this ADR be marked Superseded:

1. Restore the unconditional render of the RFQ reference field in the print template.
2. Single line change in the print template (remove or invert the conditional).
3. Author successor ADR if the new behaviour requires its own justification (e.g. the client wants the auto-generated reference shown as an internal stamp rather than a customer-facing field).
4. Update `INDEX.md`.
5. Estimated effort: less than half a dev day, inclusive of build, deploy, verification print, commit, tag.

---

## Open Questions for Client Confirmation

When this ADR is presented to Jeanic / Hendrik for ratification, the following confirmations close it:

1. Should the auto-generated RFQ reference be suppressed entirely from the printed job card for Direct Jobs?
2. If suppressed from the customer-facing area, should it appear elsewhere on the card as an internal-only tracking stamp (e.g. small text in a footer or margin), or be omitted from the printed artefact entirely?
3. Does the audit / verification approach (test-print a Direct Job and an RFQ-originated Job, compare) match Jeanic's preferred verification rigour, or would she prefer a broader regression test before this is closed?

A "yes" to question 1, plus an answer to 2 and acknowledgement of 3, will move this ADR's status from **Inferred** to **Confirmed**.

---

*This ADR was authored on 2026-05-07 prior to implementation. It documents the reasoning leading into a build, not after it.*
