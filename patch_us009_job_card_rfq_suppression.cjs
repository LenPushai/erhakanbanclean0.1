// US-009: Suppress the "Client RFQ No" cell on the printed job card
// when the value is empty (Direct Job without a customer-supplied
// reference, or any job where the field is null/whitespace-only).
//
// Date: 2026-05-07
// Tag:  us-009-job-card-rfq-suppression-2026-05-07
// ADR:  decisions/ADR-002-us009-job-card-rfq-suppression.md
//
// Audit summary (per ADR-002 spirit, Reasoning #2):
//   - The print template at App.tsx:754 currently renders three cells:
//     Job Number, Client RFQ No, Order / PO Number — with a fixed
//     CSS grid-template-columns of 1fr 1fr 1fr.
//   - For Direct Jobs without a customer reference, the val() helper
//     returns '' so the cell shows label "Client RFQ No" with an
//     empty value. ADR-002 calls out this exact "blanking" pattern as
//     the undesirable failure mode (label visible, value empty).
//   - The auto-generated rfq_no field is NOT printed anywhere — that
//     was already addressed (likely as a side effect of US-005).
//
// Fix (1 anchor):
//   Make the "Client RFQ No" cell render conditionally on
//   (job.client_rfq_number || '').trim() being truthy. When falsy,
//   the cell is omitted and the parent grid downgrades inline from
//   1fr 1fr 1fr to 1fr 1fr — same inline-style override pattern used
//   in US-J2 when the "Site Requisition" cell was removed.
//
// Idempotency sentinel: substring "(job.client_rfq_number || '').trim() ?"
//   - appears only post-patch; if found, exit clean.

const fs = require('fs');
const path = require('path');
const FILE = path.join('src', 'App.tsx');

let src = fs.readFileSync(FILE, 'utf8');

// EOL-aware: detect CRLF vs LF, normalize to LF for matching, restore on write.
const originalEol = src.includes('\r\n') ? '\r\n' : '\n';
if (originalEol === '\r\n') {
  src = src.replace(/\r\n/g, '\n');
}

// Idempotency check
if (src.includes("(job.client_rfq_number || '').trim() ?")) {
  console.log('[US-009] already applied — sentinel found in src/App.tsx');
  process.exit(0);
}

let edits = 0;
function replace(label, anchor, replacement) {
  if (!src.includes(anchor)) {
    console.error('[US-009] FAIL anchor missed: ' + label);
    process.exit(1);
  }
  src = src.replace(anchor, replacement);
  edits++;
  console.log('[US-009] OK  ' + label);
}

// ---------------------------------------------------------------------
// 1) Wrap "Client RFQ No" cell in a presence-of-value conditional and
//    flip the parent grid template inline between 3-col and 2-col.
//    Anchor is the full single-line info-grid substring at line 754.
// ---------------------------------------------------------------------
replace(
  '#1 print template info-grid (line 754)',
  '<div class="info-grid" style="grid-template-columns:1fr 1fr 1fr"><div class="info-cell"><div class="info-label">Job Number</div><div class="info-val">${val(job.job_number)}</div></div><div class="info-cell"><div class="info-label">Client RFQ No</div><div class="info-val">${val(job.client_rfq_number)}</div></div><div class="info-cell"><div class="info-label">Order / PO Number</div><div class="info-val">${val(job.po_number || (job as any).order_number)}</div></div></div>',
  '<div class="info-grid" style="grid-template-columns:${(job.client_rfq_number || \'\').trim() ? \'1fr 1fr 1fr\' : \'1fr 1fr\'}"><div class="info-cell"><div class="info-label">Job Number</div><div class="info-val">${val(job.job_number)}</div></div>${(job.client_rfq_number || \'\').trim() ? `<div class="info-cell"><div class="info-label">Client RFQ No</div><div class="info-val">${val(job.client_rfq_number)}</div></div>` : \'\'}<div class="info-cell"><div class="info-label">Order / PO Number</div><div class="info-val">${val(job.po_number || (job as any).order_number)}</div></div></div>'
);

// Restore original line endings before writing
if (originalEol === '\r\n') {
  src = src.replace(/\n/g, '\r\n');
}
fs.writeFileSync(FILE, src);
console.log('[US-009] applied ' + edits + ' edit to ' + FILE + ' (eol=' + (originalEol === '\r\n' ? 'CRLF' : 'LF') + ')');