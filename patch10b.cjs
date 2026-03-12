const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/App.tsx');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');
console.log('Lines:', lines.length);

// ── Helper ───────────────────────────────────────────────────────────────────
function findLine(pattern, startFrom = 0) {
  for (let i = startFrom; i < lines.length; i++) {
    if (lines[i].includes(pattern)) return i;
  }
  return -1;
}

// ── 1. Add Printer to imports (line 3, index 2) ──────────────────────────────
if (!lines[2].includes('Printer')) {
  lines[2] = lines[2].replace('Check }', 'Check, Printer }');
  console.log('PASS: Printer added to imports');
} else { console.log('PASS: Printer already imported'); }

// ── 2. Replace JobBoard function signature (line 342, index 341) ─────────────
const jbSigIdx = findLine('function JobBoard({');
if (jbSigIdx >= 0) {
  lines[jbSigIdx] = "function JobBoard({ jobs, loading, onCardClick, selectedId, onStatusChange, onPrintCard }: { jobs: Job[]; loading: boolean; onCardClick: (job: Job) => void; selectedId?: string; onStatusChange: (jobId: string, newStatus: string) => void; onPrintCard: (job: Job) => void }) {";
  console.log('PASS: JobBoard signature updated at line', jbSigIdx + 1);
} else { console.log('FAIL: JobBoard signature not found'); }

// ── 3. Replace columns block ─────────────────────────────────────────────────
const colStart = findLine("{ key: 'PENDING',");
const colEnd = findLine("{ key: 'COMPLETE',");
if (colStart >= 0 && colEnd >= 0) {
  // colStart-1 is "const columns = [", colEnd+1 is "  ]"
  const blockStart = colStart - 1;
  const blockEnd = colEnd + 2; // includes closing ]
  lines.splice(blockStart, blockEnd - blockStart,
    "  const columns = [",
    "    { key: 'PENDING',        label: 'Pending',        color: 'bg-gray-500'  },",
    "    { key: 'IN_REVIEW',      label: 'In Review',      color: 'bg-blue-500'  },",
    "    { key: 'READY_TO_PRINT', label: 'Ready to Print', color: 'bg-amber-500' },",
    "    { key: 'PRINTED',        label: 'Printed',        color: 'bg-green-600' },",
    "  ]"
  );
  console.log('PASS: Columns replaced');
} else { console.log('FAIL: columns block not found', colStart, colEnd); }

// ── 4. Replace card block ────────────────────────────────────────────────────
const cardStart = findLine('{cards.map(job => (');
const cardEnd = findLine('))}', cardStart + 1);
// find the closing of the cards.map - look for the pattern
// Actually find from cardStart to the line with just ")}"  after the card div
let mapEnd = -1;
for (let i = cardStart + 1; i < lines.length; i++) {
  if (lines[i].trim() === '))}') { mapEnd = i; break; }
}

if (cardStart >= 0 && mapEnd >= 0) {
  lines.splice(cardStart, mapEnd - cardStart + 1,
    "              {cards.map(job => {",
    "                const nextMap: Record<string, {label: string; next: string; color: string}[]> = {",
    "                  PENDING:        [{ label: 'Review', next: 'IN_REVIEW',      color: 'bg-blue-500 hover:bg-blue-600' }],",
    "                  IN_REVIEW:      [{ label: 'Ready',  next: 'READY_TO_PRINT', color: 'bg-amber-500 hover:bg-amber-600' }],",
    "                  READY_TO_PRINT: [{ label: 'Back',   next: 'IN_REVIEW',      color: 'bg-gray-400 hover:bg-gray-500' }],",
    "                  PRINTED:        [],",
    "                }",
    "                const nextActions = nextMap[job.status] || []",
    "                const canPrint = job.status === 'READY_TO_PRINT' || job.status === 'PRINTED'",
    "                return (",
    "                  <div key={job.id} onClick={() => onCardClick(job)}",
    "                    className={`bg-white rounded-lg shadow-sm border-2 p-3 cursor-pointer hover:shadow-md transition-all ${job.id === selectedId ? 'border-green-400 shadow-md' : 'border-transparent hover:border-green-300'}`}>",
    "                    <div className=\"flex items-center justify-between gap-1\">",
    "                      <p className=\"text-xs font-bold text-green-600\">{job.job_number || 'New'}</p>",
    "                      <div className=\"flex items-center gap-1\">",
    "                        {job.entry_type === 'DIRECT' && <span className=\"text-xs font-bold px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded\">DIRECT</span>}",
    "                        {job.is_emergency && <span className=\"text-xs font-bold px-1.5 py-0.5 bg-red-100 text-red-600 rounded\">!</span>}",
    "                      </div>",
    "                    </div>",
    "                    <p className=\"text-sm font-medium text-gray-800 mt-1 line-clamp-2\">{job.description || job.client_name || 'No description'}</p>",
    "                    <p className=\"text-xs text-gray-500 mt-0.5 truncate\">{job.client_name || '-'}</p>",
    "                    {job.due_date && (",
    "                      <p className=\"text-xs text-gray-400 mt-0.5\">Due: {new Date(job.due_date).toLocaleDateString('en-ZA')}</p>",
    "                    )}",
    "                    {(nextActions.length > 0 || canPrint) && (",
    "                      <div className=\"flex gap-1 mt-2\" onClick={e => e.stopPropagation()}>",
    "                        {nextActions.map(action => (",
    "                          <button key={action.next} onClick={() => onStatusChange(job.id, action.next)}",
    "                            className={`flex-1 py-1 text-xs font-semibold text-white rounded transition-colors ${action.color}`}>",
    "                            {action.label}",
    "                          </button>",
    "                        ))}",
    "                        {canPrint && (",
    "                          <button onClick={() => onPrintCard(job)}",
    "                            className=\"flex-1 py-1 text-xs font-semibold text-white rounded bg-green-600 hover:bg-green-700 transition-colors flex items-center justify-center gap-1\">",
    "                            <Printer size={11} />Print",
    "                          </button>",
    "                        )}",
    "                      </div>",
    "                    )}",
    "                  </div>",
    "                )",
    "              })}"
  );
  console.log('PASS: Card block replaced');
} else { console.log('FAIL: card block not found', cardStart, mapEnd); }

// ── 5. Add handlePrintJobCard + handleJobStatusChange before fetchJobs ────────
const fetchJobsIdx = findLine('const fetchJobs = async');
if (fetchJobsIdx >= 0 && !lines.some(l => l.includes('handlePrintJobCard'))) {
  lines.splice(fetchJobsIdx, 0,
    "  const handlePrintJobCard = (job: Job) => {",
    "    alert('Print Job Card: ' + (job.job_number || 'New Job') + ' - PDF coming next!')",
    "  }",
    "",
    "  const handleJobStatusChange = async (jobId: string, newStatus: string) => {",
    "    await supabase.from('jobs').update({ status: newStatus }).eq('id', jobId)",
    "    fetchJobs()",
    "  }",
    ""
  );
  console.log('PASS: handlers added before fetchJobs at line', fetchJobsIdx + 1);
} else { console.log('PASS: handlers already exist or fetchJobs not found'); }

// ── 6. Wire handlers to JobBoard render ──────────────────────────────────────
const jbRenderIdx = findLine('<JobBoard jobs={jobs}');
if (jbRenderIdx >= 0) {
  if (!lines[jbRenderIdx].includes('onStatusChange')) {
    lines[jbRenderIdx] = lines[jbRenderIdx]
      .replace('onCardClick={setSelectedJob} selectedId={selectedJob?.id}',
               'onCardClick={setSelectedJob} selectedId={selectedJob?.id} onStatusChange={handleJobStatusChange} onPrintCard={handlePrintJobCard}');
    console.log('PASS: JobBoard render wired at line', jbRenderIdx + 1);
  } else { console.log('PASS: JobBoard render already wired'); }
} else { console.log('FAIL: JobBoard render not found'); }

// ── Write ────────────────────────────────────────────────────────────────────
fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
const out = fs.readFileSync(filePath, 'utf8');
console.log('');
console.log('Total lines:', out.split('\n').length);
const checks = ['Printer', 'IN_REVIEW', 'READY_TO_PRINT', 'PRINTED', 'handlePrintJobCard', 'handleJobStatusChange', 'onStatusChange={handleJobStatusChange}'];
checks.forEach(c => console.log((out.includes(c) ? 'PASS' : 'FAIL') + ': ' + c));
console.log('Done - run: npx vite --force');
