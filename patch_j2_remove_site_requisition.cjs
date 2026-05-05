// US-J2: Remove Site Requisition from JobDetailPanel form, DirectJob form,
// and printed Job Card. Idempotent — checks for editSiteReq sentinel.
// Date:  2026-05-05
// Tag:   hotfix-jeanic2-remove-site-requisition-2026-05-05
//
// Edits (9 total):
//   1) Print template (line 754): drop 4th info-cell, override grid to 3 cols
//   2) JDP state declaration (line 1368): drop editSiteReq state
//   3) JDP handleSave `before` snapshot (line 1509): drop site_req
//   4) JDP handleSave `after` save payload (line 1522): drop site_req
//   5) JDP form input (line 1587): drop entire <div><label>...</label><input/></div>
//   6) DJ state declaration (line 1860): drop siteReq state
//   7) DJ insert payload (line 1924): strip site_req field, keep client_name
//   8) DJ row grid 3->2 cols (line 1976)
//   9) DJ form input (line 1994): drop entire <div><label>...</label><input/></div>
//
// Out of scope (intentionally kept):
//   - TS interfaces (lines 154, 196): DB column preserved
//   - Server-side passthroughs (1441, 2633, 2840, 3261): legacy data preservation

const fs = require('fs');
const path = require('path');
const FILE = path.join('src', 'App.tsx');

let src = fs.readFileSync(FILE, 'utf8');

// Detect original line endings (Windows working trees are typically CRLF
// after Git checkout with core.autocrlf=true). Normalize to LF for anchor
// matching, then restore the original EOL on write.
const originalEol = src.includes('\r\n') ? '\r\n' : '\n';
if (originalEol === '\r\n') {
  src = src.replace(/\r\n/g, '\n');
}

// Idempotency: editSiteReq is the canonical sentinel for the JDP state we are
// removing. If it is gone, the patch has already been applied.
if (!src.includes('editSiteReq')) {
  console.log('[J2] already applied — editSiteReq not found in src/App.tsx');
  process.exit(0);
}

let edits = 0;
function replace(label, anchor, replacement) {
  if (!src.includes(anchor)) {
    console.error('[J2] FAIL anchor missed: ' + label);
    process.exit(1);
  }
  src = src.replace(anchor, replacement);
  edits++;
  console.log('[J2] OK  ' + label);
}

// 1) Print template — drop 4th info-cell, override grid to 3 cols inline
replace(
  '#1 print template (line 754)',
  '<div class="info-grid"><div class="info-cell"><div class="info-label">Job Number</div><div class="info-val">${val(job.job_number)}</div></div><div class="info-cell"><div class="info-label">Client RFQ No</div><div class="info-val">${val(job.client_rfq_number)}</div></div><div class="info-cell"><div class="info-label">Order / PO Number</div><div class="info-val">${val(job.po_number || (job as any).order_number)}</div></div><div class="info-cell"><div class="info-label">Site Requisition</div><div class="info-val">${val(job.site_req)}</div></div></div>',
  '<div class="info-grid" style="grid-template-columns:1fr 1fr 1fr"><div class="info-cell"><div class="info-label">Job Number</div><div class="info-val">${val(job.job_number)}</div></div><div class="info-cell"><div class="info-label">Client RFQ No</div><div class="info-val">${val(job.client_rfq_number)}</div></div><div class="info-cell"><div class="info-label">Order / PO Number</div><div class="info-val">${val(job.po_number || (job as any).order_number)}</div></div></div>'
);

// 2) JDP state editSiteReq (line 1368) — delete entire line
replace(
  '#2 JDP state editSiteReq (line 1368)',
  "  const [editSiteReq, setEditSiteReq] = React.useState(job.site_req || '')\n",
  ''
);

// 3) JDP `before` snapshot (line 1509) — delete entire line
replace(
  '#3 JDP before snapshot (line 1509)',
  '        site_req: job.site_req ?? null,\n',
  ''
);

// 4) JDP `after` save payload (line 1522) — delete entire line
replace(
  '#4 JDP after save payload (line 1522)',
  '        site_req: editSiteReq.trim() || null,\n',
  ''
);

// 5) JDP form input (line 1587) — delete entire line including 10-space indent
replace(
  '#5 JDP form input (line 1587)',
  '          <div><label className="text-xs text-gray-500 block mb-1">Site Requisition</label><input type="text" value={editSiteReq} onChange={e => setEditSiteReq(e.target.value)} className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500" /></div>\n',
  ''
);

// 6) DJ state siteReq (line 1860) — delete entire line
replace(
  '#6 DJ state siteReq (line 1860)',
  "  const [siteReq, setSiteReq] = React.useState('')\n",
  ''
);

// 7) DJ insert payload (line 1924) — strip site_req from compound line, keep client_name
replace(
  '#7 DJ insert payload (line 1924)',
  'client_name: resolvedClientName, site_req: siteReq.trim() || null,',
  'client_name: resolvedClientName,'
);

// 8) DJ row grid 3->2 (line 1976) — disambiguated by Client * label suffix
replace(
  '#8 DJ row grid-cols-3 -> grid-cols-2 (line 1976)',
  '<div className="grid grid-cols-3 gap-4">\n            <div>\n              <label className="block text-xs font-medium text-gray-600 mb-1">Client *</label>',
  '<div className="grid grid-cols-2 gap-4">\n            <div>\n              <label className="block text-xs font-medium text-gray-600 mb-1">Client *</label>'
);

// 9) DJ form input (line 1994) — delete entire line including 12-space indent
replace(
  '#9 DJ form input (line 1994)',
  '            <div><label className="block text-xs font-medium text-gray-600 mb-1">Site Requisition</label><input value={siteReq} onChange={e => setSiteReq(e.target.value)} placeholder="e.g. SR-2026-04887" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>\n',
  ''
);

// Restore original line endings before writing
if (originalEol === '\r\n') {
  src = src.replace(/\n/g, '\r\n');
}
fs.writeFileSync(FILE, src);
console.log('[J2] applied ' + edits + ' edits to ' + FILE + ' (eol=' + (originalEol === '\r\n' ? 'CRLF' : 'LF') + ')');