$content = @'
const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

const idx = lines.findIndex(l => l.includes('is_parent: true') && l.includes('parentJob.id'));
if (idx > -1) {
  const insert = "      await supabase.from('job_line_items').insert({ job_id: childJob.id, description: description.trim(), quantity: lineItem.quantity||1, uom: lineItem.uom||'EA', item_type: lineItem.item_type||'MATERIAL', cost_price:0, sell_price:0, line_total:0, status:'PENDING', sort_order:1, can_spawn_job:false })\r";
  lines.splice(idx, 0, insert);
  console.log('[1] Child line item insert added before line ' + (idx + 1));
} else {
  console.log('[1] ERROR: target line not found');
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Bug5b patch complete');
'@

Set-Content -Path "patch_bug5b.cjs" -Value $content -Encoding ASCII
Write-Host "patch_bug5b.cjs written - running now..."
node patch_bug5b.cjs