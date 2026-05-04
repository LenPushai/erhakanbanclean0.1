// patch_d2_quantity_sync.cjs v2 — D2 hotfix layer 2
// Three changes:
//   1. JobDetailPanel: don't sync child→parent qty upward
//   2. SpawnJobModal handleCreate: cap child qty at parent qty (alert+abort)
//   3. SpawnJobModal: don't overwrite parent line item qty during spawn
const fs = require('fs');
const path = require('path');

const FILE = path.join('src', 'App.tsx');
const original = fs.readFileSync(FILE, 'utf8');

if (original.includes('D2 hotfix: parent qty is canonical')) {
    console.log('SKIP: patch already present');
    process.exit(0);
}

let patched = original;
let appliedCount = 0;

// =========================================================================
// CHANGE 1 — JobDetailPanel: remove upward child→parent qty sync (lines ~1673-1685)
// =========================================================================
const C1_RE = /\/\/ If this is a child job, sync quantity back to parent line item\s*\n(\s*)if \(job\.is_child_job && job\.parent_job_id\) \{[\s\S]*?\n\1\}\s*\n(\s*)setLineItems\(prev => prev\.map\(li => li\.id === item\.id \? \{ \.\.\.li, quantity: newQty \} : li\)\)\s*\n\s*showMsg\('Quantity updated' \+ \(job\.is_child_job \? ' & synced to parent' : ''\)\)/;

const C1_REPLACEMENT = `// D2 hotfix: parent qty is canonical (sourced from RFQ).
                            // Removed upward sync so child edits cannot overwrite parent line item qty.
                            // We log divergence as ML signal for over-spawn analysis.
                            if (job.is_child_job && job.parent_job_id) {
                              const { data: parentItems } = await supabase.from('job_line_items').select('id, quantity').eq('child_job_id', job.id)
                              if (parentItems && parentItems.length > 0 && parentItems[0].quantity !== newQty) {
                                await supabase.from('activity_log').insert({
                                  action_type: 'child_qty_diverged_from_parent', entity_type: 'job', entity_id: job.parent_job_id,
                                  metadata: { child_job_id: job.id, parent_job_id: job.parent_job_id, parent_qty: parentItems[0].quantity, child_qty: newQty, diverged_at: new Date().toISOString() },
                                })
                              }
                            }
                            setLineItems(prev => prev.map(li => li.id === item.id ? { ...li, quantity: newQty } : li))
                            showMsg('Quantity updated')`;

if (C1_RE.test(patched)) {
    patched = patched.replace(C1_RE, C1_REPLACEMENT);
    appliedCount++;
    console.log('OK: change 1 applied (JobDetailPanel upward sync removed)');
} else {
    console.error('FAIL: change 1 anchor not found');
    process.exit(1);
}

// =========================================================================
// CHANGE 2 — SpawnJobModal handleCreate: add qty cap guard (line ~3219)
// =========================================================================
const C2_RE = /(if \(!description\.trim\(\)\) \{ alert\('Description is required'\); return \}\s*\n\s*setSaving\(true\))/;

const C2_REPLACEMENT = `if (!description.trim()) { alert('Description is required'); return }
    // D2 hotfix: cap child qty at parent line item qty (RFQ canonical)
    const parentQty = lineItem.quantity || 0
    if (quantity > parentQty) {
      alert('Child quantity (' + quantity + ') cannot exceed parent line item quantity (' + parentQty + '). The customer ordered ' + parentQty + ' on the original RFQ.')
      return
    }
    setSaving(true)`;

if (C2_RE.test(patched)) {
    patched = patched.replace(C2_RE, C2_REPLACEMENT);
    appliedCount++;
    console.log('OK: change 2 applied (SpawnJobModal qty cap guard added)');
} else {
    console.error('FAIL: change 2 anchor not found');
    process.exit(1);
}

// =========================================================================
// CHANGE 3 — SpawnJobModal: remove parent qty overwrite at line ~3259
// =========================================================================
const C3_RE = /await supabase\.from\('job_line_items'\)\.update\(\{ child_job_id: childJob\.id, quantity: quantity \}\)\.eq\('id', lineItem\.id\)/;

const C3_REPLACEMENT = `// D2 hotfix: only link child_job_id, never overwrite parent qty (RFQ canonical)
      await supabase.from('job_line_items').update({ child_job_id: childJob.id }).eq('id', lineItem.id)`;

if (C3_RE.test(patched)) {
    patched = patched.replace(C3_RE, C3_REPLACEMENT);
    appliedCount++;
    console.log('OK: change 3 applied (SpawnJobModal parent qty overwrite removed)');
} else {
    console.error('FAIL: change 3 anchor not found');
    process.exit(1);
}

if (patched === original) {
    console.error('FAIL: no changes applied');
    process.exit(1);
}

fs.writeFileSync(FILE, patched, 'utf8');
console.log('OK: ' + appliedCount + ' changes applied to src/App.tsx');
console.log('Next: npm run build && npx vercel --prod');
