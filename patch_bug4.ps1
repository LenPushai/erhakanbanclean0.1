$content = @'
const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// 1. Job detail panel - show po_number, label PO Number
const detailIdx = lines.findIndex(l => l.includes('Site / PO') && l.includes('site_req'));
if (detailIdx > -1) {
  lines[detailIdx] = lines[detailIdx]
    .replace('Site / PO', 'PO Number')
    .replace('(job as any).site_req', '(job as any).po_number');
  console.log('[1] Job detail panel fixed at ' + (detailIdx + 1));
} else { console.log('[1] ERROR: detail line not found'); }

// 2. Remove SITE REQ from job card print
const printIdx = lines.findIndex(l => l.includes('SITE REQ') && l.includes('site_req'));
if (printIdx > -1) {
  lines.splice(printIdx, 1);
  console.log('[2] SITE REQ removed from print');
} else { console.log('[2] ERROR: print line not found'); }

// 3. Rename Direct Job modal label
const modalIdx = lines.findIndex(l => l.includes('Site Req / PO') && l.includes('siteReq'));
if (modalIdx > -1) {
  lines[modalIdx] = lines[modalIdx]
    .replace('Site Req / PO', 'PO Number')
    .replace('placeholder=\"e.g. PO-12345\"', 'placeholder=\"e.g. PO-12345\"');
  console.log('[3] Direct Job modal label fixed at ' + (modalIdx + 1));
} else { console.log('[3] ERROR: modal line not found'); }

// 4. Wire Direct Job save to po_number
const saveIdx = lines.findIndex(l => l.includes('site_req: siteReq.trim()'));
if (saveIdx > -1) {
  lines[saveIdx] = lines[saveIdx]
    .replace('site_req: siteReq.trim() || null', 'po_number: siteReq.trim() || null');
  console.log('[4] Direct Job save wired to po_number at ' + (saveIdx + 1));
} else { console.log('[4] ERROR: save line not found'); }

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Bug4 patch complete');
'@

Set-Content -Path "patch_bug4.cjs" -Value $content -Encoding ASCII
Write-Host "patch_bug4.cjs written - running now..."
node patch_bug4.cjs