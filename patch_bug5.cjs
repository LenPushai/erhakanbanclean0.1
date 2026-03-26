const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// 1. Insert line item for child job after child_job_id update
const updateIdx = lines.findIndex(l => l.includes('child_job_id: childJob.id') && l.includes('lineItem.id'));
if (updateIdx > -1) {
  const insert = "      await supabase.from('job_line_items').insert({ job_id: childJob.id, description: description.trim(), quantity: lineItem.quantity||1, uom: lineItem.uom||'EA', item_type: lineItem.item_type||'MATERIAL', cost_price:0, sell_price:0, line_total:0, status:'PENDING', sort_order:1, can_spawn_job:false })\r";
  lines.splice(updateIdx + 1, 0, insert);
  console.log('[1] Child job line item insert added at ' + (updateIdx + 2));
} else { console.log('[1] ERROR: child_job_id update line not found'); }

// 2. Fix site_req on spawn to use po_number
const siteIdx = lines.findIndex(l => l.includes('site_req:') && l.includes('parentJob.site_req'));
if (siteIdx > -1) {
  lines[siteIdx] = lines[siteIdx].replace('site_req:                 parentJob.site_req || null', 'po_number:                parentJob.po_number || null');
  console.log('[2] site_req replaced with po_number on spawn at ' + (siteIdx + 1));
} else { console.log('[2] ERROR: site_req spawn line not found'); }

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Bug5 patch complete');
