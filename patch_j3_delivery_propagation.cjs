// US-J3: Workshop Board — propagate parent line-item delivery fields
// (delivery_number, delivery_date) to child mirror rows linked via
// parent_line_item_id. Mirrors the US-002 status-propagation pattern.
//
// Date: 2026-05-06
// Tag:  hotfix-jeanic3-delivery-propagation-2026-05-06
//
// Edits (3 total):
//   1) Replace handleDeliveryField (App.tsx:3639) with a propagating
//      version that also writes a line_item_delivery_propagated event
//      to activity_log, mirroring the US-002 line_item_status_propagated
//      pattern at line 3613.
//   2) Add disabled / title / greyed-style guards to the delivery_number
//      <input> at App.tsx:4210, mirroring the qc_done checkbox treatment
//      at line 4189-4193 — child rows must not be editable.
//   3) Same treatment for the delivery_date <input> at App.tsx:4218.
//
// No DB migration: public.job_line_items already has delivery_number,
// delivery_date, parent_line_item_id columns (verified via REST probe).
//
// No backfill: US-002 propagates on edit only; this patch matches that
// discipline. Legacy children with empty delivery fields will sync the
// next time the user re-enters values on the parent.
//
// Idempotency sentinel: presence of substring 'line_item_delivery_propagated'
//   - if found, patch has already been applied; exit clean.

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
if (src.includes('line_item_delivery_propagated')) {
  console.log('[J3] already applied — line_item_delivery_propagated found in src/App.tsx');
  process.exit(0);
}

let edits = 0;
function replace(label, anchor, replacement) {
  if (!src.includes(anchor)) {
    console.error('[J3] FAIL anchor missed: ' + label);
    process.exit(1);
  }
  src = src.replace(anchor, replacement);
  edits++;
  console.log('[J3] OK  ' + label);
}

// ---------------------------------------------------------------------
// 1) Replace handleDeliveryField (App.tsx:3639-3642) with a version
//    that propagates to child rows and logs activity_log events.
// ---------------------------------------------------------------------
replace(
  '#1 handleDeliveryField -> propagating version (line 3639)',
  "  const handleDeliveryField = async (li: any, field: 'delivery_number' | 'delivery_date', value: string) => {\n    await supabase.from('job_line_items').update({ [field]: value || null }).eq('id', li.id)\n    setExecLineItems(prev => prev.map(x => x.id === li.id ? { ...x, [field]: value || null } : x))\n  }\n",
  "  const handleDeliveryField = async (li: any, field: 'delivery_number' | 'delivery_date', value: string) => {\n    const next = value || null\n    await supabase.from('job_line_items').update({ [field]: next }).eq('id', li.id)\n    setExecLineItems(prev => prev.map(x => x.id === li.id ? { ...x, [field]: next } : x))\n    // US-J3: propagate parent line-item delivery fields to child mirror rows\n    const { data: childMirrors } = await supabase.from('job_line_items').select('id, child_job_id, job_id').eq('parent_line_item_id', li.id)\n    if (childMirrors && childMirrors.length > 0) {\n      const propagatedEntity = (job.operating_entity === 'ERHA_FC' || job.operating_entity === 'ERHA_SS') ? job.operating_entity : activeEntity\n      const now = new Date().toISOString()\n      for (const child of childMirrors) {\n        await supabase.from('job_line_items').update({ [field]: next }).eq('id', child.id)\n        supabase.from('activity_log').insert({\n          action_type: 'line_item_delivery_propagated', entity_type: 'job_line_item', entity_id: child.id,\n          operating_entity: propagatedEntity,\n          metadata: { parent_line_item_id: li.id, child_job_id: child.job_id, field, value: next, propagated_at: now },\n        }).then(({ error: logErr }) => { if (logErr) console.error('Activity log error:', logErr.message) })\n      }\n      const n = childMirrors.length\n      setPropagatedMsg(`Delivery ${field === 'delivery_number' ? 'note' : 'date'} propagated to ${n} child line${n === 1 ? '' : 's'}`)\n      setTimeout(() => setPropagatedMsg(''), 3000)\n    }\n  }\n"
);

// ---------------------------------------------------------------------
// 2) delivery_number input — guard child rows
// ---------------------------------------------------------------------
replace(
  '#2 delivery_number <input> guards (line 4210-4212)',
  "                            <input type=\"text\" placeholder=\"DEL-001\" defaultValue={li.delivery_number || ''}\n                              onBlur={e => handleDeliveryField(li, 'delivery_number', e.target.value)}\n                              style={{ width: '90px', border: '1px solid #dde3ec', borderRadius: '4px', padding: '3px 6px', fontSize: '11px', color: '#1d3461' }} />\n",
  "                            <input type=\"text\" placeholder=\"DEL-001\" defaultValue={li.delivery_number || ''}\n                              disabled={!!li.parent_line_item_id}\n                              title={li.parent_line_item_id ? 'Set on parent — auto-syncs to children' : undefined}\n                              onBlur={e => handleDeliveryField(li, 'delivery_number', e.target.value)}\n                              style={{ width: '90px', border: '1px solid #dde3ec', borderRadius: '4px', padding: '3px 6px', fontSize: '11px', color: '#1d3461', cursor: li.parent_line_item_id ? 'not-allowed' : 'text', opacity: li.parent_line_item_id ? 0.5 : 1, background: li.parent_line_item_id ? '#f1f5f9' : 'white' }} />\n"
);

// ---------------------------------------------------------------------
// 3) delivery_date input — guard child rows
// ---------------------------------------------------------------------
replace(
  '#3 delivery_date <input> guards (line 4218-4220)',
  "                          <input type=\"date\" defaultValue={li.delivery_date || ''}\n                            onBlur={e => handleDeliveryField(li, 'delivery_date', e.target.value)}\n                            style={{ border: '1px solid #dde3ec', borderRadius: '4px', padding: '3px 6px', fontSize: '11px', color: '#1d3461' }} />\n",
  "                          <input type=\"date\" defaultValue={li.delivery_date || ''}\n                            disabled={!!li.parent_line_item_id}\n                            title={li.parent_line_item_id ? 'Set on parent — auto-syncs to children' : undefined}\n                            onBlur={e => handleDeliveryField(li, 'delivery_date', e.target.value)}\n                            style={{ border: '1px solid #dde3ec', borderRadius: '4px', padding: '3px 6px', fontSize: '11px', color: '#1d3461', cursor: li.parent_line_item_id ? 'not-allowed' : 'text', opacity: li.parent_line_item_id ? 0.5 : 1, background: li.parent_line_item_id ? '#f1f5f9' : 'white' }} />\n"
);

// Restore original line endings before writing
if (originalEol === '\r\n') {
  src = src.replace(/\n/g, '\r\n');
}
fs.writeFileSync(FILE, src);
console.log('[J3] applied ' + edits + ' edits to ' + FILE + ' (eol=' + (originalEol === '\r\n' ? 'CRLF' : 'LF') + ')');