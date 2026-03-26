const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// 1. Add client_rfq_number to Job interface
const jobIfaceIdx = lines.findIndex(l => l.includes('action_other?: boolean | null'));
lines.splice(jobIfaceIdx + 1, 0, "  client_rfq_number?: string | null\r");

// 2. Copy client_rfq_number at Order Won
const poIdx = lines.findIndex(l => l.includes('po_number: poNumber.trim()') && l.includes('order_number'));
lines.splice(poIdx + 1, 0, "        client_rfq_number: rfq.client_rfq_number || null,\r");

// 3. Fix Job board RFQ No to prefer client_rfq_number
const rfqNoIdx = lines.findIndex(l => l.includes('RFQ No') && l.includes('job.rfq_no'));
if (rfqNoIdx > -1) {
  lines[rfqNoIdx] = lines[rfqNoIdx].replace(
    '{job.rfq_no || \'\u2014\'}',
    '{(job as any).client_rfq_number || job.rfq_no || \'\u2014\'}'
  );
}

// 4. Remove duplicate hash-icon client_rfq_number on RFQ card
const dupIdx = lines.findIndex(l => l.includes('rfq.client_rfq_number') && l.includes('Hash') && l.includes('size={9}'));
if (dupIdx > -1) lines.splice(dupIdx, 1);

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Bug2 patch done');
console.log('  [1] client_rfq_number added to Job interface at ' + (jobIfaceIdx + 2));
console.log('  [2] client_rfq_number copied at Order Won after line ' + (poIdx + 1));
console.log('  [3] Job board RFQ No display fixed at ' + rfqNoIdx);
console.log('  [4] Duplicate hash-icon removed at ' + dupIdx);
