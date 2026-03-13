const fs = require('fs');
const path = require('path');

// 1. Copy emailService.ts to src/
const src = path.join(__dirname, 'emailService.ts');
const dest = path.join(__dirname, 'src', 'emailService.ts');
fs.copyFileSync(src, dest);
console.log('PASS: emailService.ts copied to src/');

// 2. Wire up email imports and triggers in App.tsx
const filePath = path.join(__dirname, 'src/App.tsx');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Add import after supabase import
const supabaseImportIdx = lines.findIndex(l => l.includes("from './lib/supabase'"));
if (!lines.some(l => l.includes('emailService'))) {
  lines.splice(supabaseImportIdx + 1, 0,
    "import { emailRFQCreated, emailQuoterAssigned, emailQuoteReady, emailOrderWon, emailJobInReview, emailJobReadyToPrint, emailJobPrinted, emailChildJobSpawned } from './emailService'"
  );
  console.log('PASS: email imports added');
} else {
  console.log('PASS: email imports already exist');
}

// 3. Wire email into handleJobStatusChange
const statusChangeIdx = lines.findIndex(l => l.includes('const handleJobStatusChange = async'));
console.log('handleJobStatusChange at line:', statusChangeIdx + 1);

// Find the end of handleJobStatusChange
let statusChangeEnd = statusChangeIdx;
for (let i = statusChangeIdx + 1; i < lines.length; i++) {
  if (lines[i].trim() === '}') { statusChangeEnd = i; break; }
}
console.log('handleJobStatusChange ends at line:', statusChangeEnd + 1);

// Replace the function with email-wired version
lines.splice(statusChangeIdx, statusChangeEnd - statusChangeIdx + 1,
  "  const handleJobStatusChange = async (jobId: string, newStatus: string) => {",
  "    await supabase.from('jobs').update({ status: newStatus }).eq('id', jobId)",
  "    const { data: job } = await supabase.from('jobs').select('*').eq('id', jobId).single()",
  "    if (job) {",
  "      if (newStatus === 'IN_REVIEW') emailJobInReview(job)",
  "      if (newStatus === 'READY_TO_PRINT') emailJobReadyToPrint(job)",
  "      if (newStatus === 'PRINTED') emailJobPrinted(job)",
  "    }",
  "    fetchJobs()",
  "  }"
);
console.log('PASS: handleJobStatusChange wired with email triggers');

// 4. Wire email into Order Won (find the showMsg for order won)
const orderWonMsgIdx = lines.findIndex(l => l.includes("showMsg('Order won!"));
console.log('Order Won showMsg at line:', orderWonMsgIdx + 1);

if (orderWonMsgIdx >= 0) {
  // Insert email trigger before the showMsg
  lines.splice(orderWonMsgIdx, 0,
    "        if (jobData) emailOrderWon(data, jobData.job_number || '')"
  );
  console.log('PASS: emailOrderWon wired into Order Won flow');
} else {
  console.log('FAIL: Order Won showMsg not found');
}

// 5. Wire email into handleSpawnJob success
const spawnMsgIdx = lines.findIndex(l => l.includes("showMsg('Child job ") && l.includes('created!'));
console.log('Spawn showMsg at line:', spawnMsgIdx + 1);

if (spawnMsgIdx >= 0) {
  lines.splice(spawnMsgIdx, 0,
    "      if (childJob) emailChildJobSpawned(job, childJob)"
  );
  console.log('PASS: emailChildJobSpawned wired into spawn flow');
} else {
  console.log('FAIL: Spawn showMsg not found');
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('');
console.log('Total lines:', lines.length);
console.log('Done - run: npx vite --force');
