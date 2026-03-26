$content = @'
const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// 1. Remove orphan lines at top (lines 0-3)
if (lines[0].includes('RFQBoard') && lines[3].includes('WorkshopBoard')) {
  lines.splice(0, 4);
  console.log('[1] Removed 4 orphan lines from top');
} else {
  console.log('[1] SKIP - top lines not as expected: ' + lines[0].substring(0,50));
}

// 2. Fix board render - find the rfq/job only ternary and replace with 3-way
const renderIdx = lines.findIndex(l => l.includes('activeBoard === \'rfq\'') && l.includes('RFQBoard') && l.includes('JobBoard'));
if (renderIdx > -1) {
  lines[renderIdx] = "            {activeBoard === 'rfq'\r";
  lines.splice(renderIdx + 1, 0, "              ? <RFQBoard rfqs={rfqs} loading={loading} error={error} onRefresh={fetchRFQs} onCardClick={setSelectedRFQ} selectedId={selectedRFQ?.id} />\r");
  lines.splice(renderIdx + 2, 0, "              : activeBoard === 'job'\r");
  lines.splice(renderIdx + 3, 0, "              ? <JobBoard jobs={jobs} loading={jobsLoading} onStatusChange={handleJobStatusChange} onPrintCard={handlePrintJobCard} onCardClick={setSelectedJob} selectedId={selectedJob?.id} />\r");
  lines.splice(renderIdx + 4, 0, "              : <WorkshopBoard jobs={workshopJobs} loading={workshopLoading} onRefresh={fetchWorkshopJobs} onStatusChange={handleWorkshopStatusChange} />}\r");
  console.log('[2] Board render fixed at ' + (renderIdx + 1));
} else {
  console.log('[2] SKIP - render line not found');
}

// 3. Dedent WorkshopBoard component - remove leading spaces
const wbStart = lines.findIndex(l => l.includes('// WORKSHOP BOARD') && l.includes('              '));
if (wbStart > -1) {
  for (let i = wbStart; i < lines.length; i++) {
    lines[i] = lines[i].replace(/^              /, '');
  }
  console.log('[3] WorkshopBoard dedented starting at ' + (wbStart + 1));
} else {
  console.log('[3] SKIP - WorkshopBoard comment not found with indent');
}

// 4. Remove orphan fetchWorkshopJobs at top if still there
const orphanFetch = lines.findIndex((l, i) => i < 10 && l.includes('const fetchWorkshopJobs'));
if (orphanFetch > -1) {
  // find end of this orphan function
  let end = orphanFetch;
  while (end < lines.length && !lines[end].includes('}')) end++;
  lines.splice(orphanFetch, end - orphanFetch + 2);
  console.log('[4] Orphan fetchWorkshopJobs removed');
} else {
  console.log('[4] No orphan fetchWorkshopJobs found');
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Workshop fix complete');
'@

Set-Content -Path "patch_workshop_fix.cjs" -Value $content -Encoding ASCII
Write-Host "patch_workshop_fix.cjs written - running now..."
node patch_workshop_fix.cjs