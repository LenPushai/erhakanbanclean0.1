$content = @'
const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// 1. Find and extract handleWorkshopStatusChange from inside RFQBoard (line ~519)
const handlerStart = lines.findIndex((l, i) => i > 510 && i < 540 && l.includes('const handleWorkshopStatusChange'));
if (handlerStart > -1) {
  // find end of handler (closing brace)
  let handlerEnd = handlerStart;
  for (let i = handlerStart + 1; i < handlerStart + 20; i++) {
    if (lines[i].trim() === '}') { handlerEnd = i; break; }
  }
  const handler = lines.splice(handlerStart, handlerEnd - handlerStart + 1);
  console.log('[1] Extracted handler lines ' + (handlerStart+1) + ' to ' + (handlerEnd+1));

  // 2. Fix emailOrderWon in extracted handler
  for (let i = 0; i < handler.length; i++) {
    if (handler[i].includes('emailOrderWon') && !handler[i].includes('job.job_number')) {
      handler[i] = handler[i].replace(
        "emailOrderWon({ id: job.rfq_id, description: job.description || '' } as any)",
        "emailOrderWon({ id: job.rfq_id, description: job.description || '' } as any, job.job_number || '')"
      );
      console.log('[2] emailOrderWon fixed');
    }
  }

  // 3. Insert handler before App() return statement
  const returnIdx = lines.findIndex((l, i) => i > 400 && i < 520 && l.trim() === 'return (');
  lines.splice(returnIdx, 0, ...handler, '\r');
  console.log('[3] Handler inserted at ' + (returnIdx + 1));
} else {
  console.log('[1] Handler not found in RFQBoard area');
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Final patch complete');
'@

Set-Content -Path "patch_final.cjs" -Value $content -Encoding ASCII
Write-Host "patch_final.cjs written - running now..."
node patch_final.cjs