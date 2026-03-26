const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// Fix emailOrderWon - add second argument
const emailIdx = lines.findIndex(l => l.includes('emailOrderWon') && l.includes('rfq_id') && l.includes('description') && !l.includes('job.job_number'));
if (emailIdx > -1) {
  lines[emailIdx] = lines[emailIdx].replace(
    "emailOrderWon({ id: job.rfq_id, description: job.description || '' } as any)",
    "emailOrderWon({ id: job.rfq_id, description: job.description || '' } as any, job.job_number || '')"
  );
  console.log('[1] emailOrderWon fixed at ' + (emailIdx + 1));
} else {
  console.log('[1] emailOrderWon already fixed or not found');
}

// Remove orphan RFQBoard fragment after handleWorkshopStatusChange closing brace
const handlerEnd = lines.findIndex(l => l.trim() === '}' && lines[lines.indexOf(l) - 1] && lines[lines.indexOf(l) - 2].includes('fetchWorkshopJobs'));
const orphanStart = lines.findIndex((l, i) => i > 530 && i < 560 && l.includes('return (') && l.includes('col.key'));
if (orphanStart > -1) {
  let orphanEnd = orphanStart;
  let depth = 0;
  for (let i = orphanStart; i < lines.length; i++) {
    if (lines[i].includes('// RFQ CARD')) { orphanEnd = i; break; }
  }
  const removed = orphanEnd - orphanStart;
  lines.splice(orphanStart, removed);
  console.log('[2] Removed ' + removed + ' orphan lines starting at ' + (orphanStart + 1));
} else {
  console.log('[2] No orphan fragment found');
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Orphan patch complete');
