const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');
const crlf = c.includes('\r\n');
const nl = crlf ? '\r\n' : '\n';
let changes = 0;

// Handler 1: JobDetailPanel inline spawn
const old1 = 'if (jobError) throw jobError' + nl + '      const { error: liError } = await supabase.from(\'job_line_items\').update({ child_job_id: childJob.id }).eq(\'id\', lineItem.id)';
const rep1 = 'if (jobError) throw jobError' + nl + '      // Create line item for child job so it prints on the card' + nl + '      await supabase.from(\'job_line_items\').insert({ job_id: childJob.id, description: lineItem.description, quantity: lineItem.quantity || 1, uom: lineItem.uom || \'EA\', item_type: lineItem.item_type || \'MATERIAL\', cost_price: 0, sell_price: 0, line_total: 0, status: \'PENDING\', sort_order: 0, can_spawn_job: false })' + nl + '      const { error: liError } = await supabase.from(\'job_line_items\').update({ child_job_id: childJob.id }).eq(\'id\', lineItem.id)';
if (c.includes(old1)) { c = c.replace(old1, rep1); changes++; console.log('Handler 1: PATCHED'); }
else { console.log('Handler 1: FAILED'); }

// Handler 2: SpawnJobModal
const old2 = 'if (error) throw error' + nl + '      await supabase.from(\'job_line_items\').update({ child_job_id: childJob.id }).eq(\'id\', lineItem.id)' + nl + '      await supabase.from(\'jobs\').update({ is_parent: true }).eq(\'id\', parentJob.id)';
const rep2 = 'if (error) throw error' + nl + '      // Create line item for child job so it prints on the card' + nl + '      await supabase.from(\'job_line_items\').insert({ job_id: childJob.id, description: lineItem.description || description.trim(), quantity: lineItem.quantity || 1, uom: lineItem.uom || \'EA\', item_type: lineItem.item_type || \'MATERIAL\', cost_price: 0, sell_price: 0, line_total: 0, status: \'PENDING\', sort_order: 0, can_spawn_job: false })' + nl + '      await supabase.from(\'job_line_items\').update({ child_job_id: childJob.id }).eq(\'id\', lineItem.id)' + nl + '      await supabase.from(\'jobs\').update({ is_parent: true }).eq(\'id\', parentJob.id)';
if (c.includes(old2)) { c = c.replace(old2, rep2); changes++; console.log('Handler 2: PATCHED'); }
else { console.log('Handler 2: FAILED'); }

fs.writeFileSync('src/App.tsx', c, 'utf8');
console.log('Total patches:', changes);