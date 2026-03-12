const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/App.tsx');
let content = fs.readFileSync(filePath, 'utf8');
let pass = 0; let fail = 0;

function check(name, ok) {
  console.log((ok ? 'PASS' : 'FAIL') + ': ' + name);
  if (ok) pass++; else fail++;
}

// ── 1. Replace Job Board columns ─────────────────────────────────────────────
const oldColumns = `  const columns = [
    { key: 'PENDING',       label: 'Pending',       color: 'bg-gray-500'   },
    { key: 'SCHEDULED',     label: 'Scheduled',     color: 'bg-blue-500'   },
    { key: 'IN_PROGRESS',   label: 'In Progress',   color: 'bg-orange-500' },
    { key: 'ON_HOLD',       label: 'On Hold',       color: 'bg-red-400'    },
    { key: 'QUALITY_CHECK', label: 'Quality Check', color: 'bg-purple-500' },
    { key: 'COMPLETE',      label: 'Complete',      color: 'bg-green-500'  },
  ]`;

const newColumns = `  const columns = [
    { key: 'PENDING',        label: 'Pending',         color: 'bg-gray-500'   },
    { key: 'IN_REVIEW',      label: 'In Review',       color: 'bg-blue-500'   },
    { key: 'READY_TO_PRINT', label: 'Ready to Print',  color: 'bg-amber-500'  },
    { key: 'PRINTED',        label: 'Printed',         color: 'bg-green-600'  },
  ]`;

if (content.includes(oldColumns)) {
  content = content.replace(oldColumns, newColumns);
  check('Job Board columns updated to Phase 1 flow', true);
} else { check('Job Board columns updated', false); }

// ── 2. Replace job card (with Phase 1 action buttons + print trigger) ─────────
const oldCard = `              {cards.map(job => {
                const nextActions: { label: string; next: string; color: string }[] = {
                  PENDING:       [{ label: 'Schedule',   next: 'SCHEDULED',     color: 'bg-blue-500 hover:bg-blue-600' }],
                  SCHEDULED:     [{ label: 'Start Work', next: 'IN_PROGRESS',   color: 'bg-orange-500 hover:bg-orange-600' }],
                  IN_PROGRESS:   [{ label: 'Hold',       next: 'ON_HOLD',       color: 'bg-red-400 hover:bg-red-500' },
                                  { label: 'To QC',      next: 'QUALITY_CHECK', color: 'bg-purple-500 hover:bg-purple-600' }],
                  ON_HOLD:       [{ label: 'Resume',     next: 'IN_PROGRESS',   color: 'bg-orange-500 hover:bg-orange-600' }],
                  QUALITY_CHECK: [{ label: 'Complete',   next: 'COMPLETE',      color: 'bg-green-500 hover:bg-green-600' },
                                  { label: 'Rework',     next: 'IN_PROGRESS',   color: 'bg-orange-400 hover:bg-orange-500' }],
                  COMPLETE:      [],
                }[job.status] || []
                return (
                  <div key={job.id} onClick={() => onCardClick(job)}
                    className={\`bg-white rounded-lg shadow-sm border-2 p-3 cursor-pointer hover:shadow-md transition-all \${job.id === selectedId ? 'border-green-400 shadow-md' : 'border-transparent hover:border-green-300'}\`}>
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-green-600">{job.job_number || 'New'}</p>
                      <div className="flex items-center gap-1">
                        {job.entry_type === 'DIRECT' && <span className="text-xs font-bold px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded">DIRECT</span>}
                        {job.is_emergency && <span className="text-xs font-bold px-1.5 py-0.5 bg-red-100 text-red-600 rounded">!</span>}
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-800 mt-1 line-clamp-2">{job.description || job.client_name || 'No description'}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{job.client_name || '-'}</p>
                    {job.due_date && (
                      <p className="text-xs text-gray-400 mt-0.5">Due: {new Date(job.due_date).toLocaleDateString('en-ZA')}</p>
                    )}
                    {nextActions.length > 0 && (
                      <div className="flex gap-1 mt-2" onClick={e => e.stopPropagation()}>
                        {nextActions.map(action => (
                          <button key={action.next} onClick={() => onStatusChange(job.id, action.next)}
                            className={\`flex-1 py-1 text-xs font-semibold text-white rounded transition-colors \${action.color}\`}>
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}`;

const newCard = `              {cards.map(job => {
                const nextActions: { label: string; next: string; color: string }[] = ({
                  PENDING:        [{ label: 'Review',   next: 'IN_REVIEW',      color: 'bg-blue-500 hover:bg-blue-600' }],
                  IN_REVIEW:      [{ label: 'Ready',    next: 'READY_TO_PRINT', color: 'bg-amber-500 hover:bg-amber-600' }],
                  READY_TO_PRINT: [{ label: 'Back',     next: 'IN_REVIEW',      color: 'bg-gray-400 hover:bg-gray-500' }],
                  PRINTED:        [],
                } as any)[job.status] || []
                const canPrint = job.status === 'READY_TO_PRINT' || job.status === 'PRINTED'
                return (
                  <div key={job.id} onClick={() => onCardClick(job)}
                    className={\`bg-white rounded-lg shadow-sm border-2 p-3 cursor-pointer hover:shadow-md transition-all \${job.id === selectedId ? 'border-green-400 shadow-md' : 'border-transparent hover:border-green-300'}\`}>
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-green-600">{job.job_number || 'New'}</p>
                      <div className="flex items-center gap-1">
                        {job.entry_type === 'DIRECT' && <span className="text-xs font-bold px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded">DIRECT</span>}
                        {job.is_emergency && <span className="text-xs font-bold px-1.5 py-0.5 bg-red-100 text-red-600 rounded">!</span>}
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-800 mt-1 line-clamp-2">{job.description || job.client_name || 'No description'}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{job.client_name || '-'}</p>
                    {job.due_date && (
                      <p className="text-xs text-gray-400 mt-0.5">Due: {new Date(job.due_date).toLocaleDateString('en-ZA')}</p>
                    )}
                    <div className="flex gap-1 mt-2" onClick={e => e.stopPropagation()}>
                      {nextActions.map((action: any) => (
                        <button key={action.next} onClick={() => onStatusChange(job.id, action.next)}
                          className={\`flex-1 py-1 text-xs font-semibold text-white rounded transition-colors \${action.color}\`}>
                          {action.label}
                        </button>
                      ))}
                      {canPrint && (
                        <button onClick={() => onPrintCard(job)}
                          className="flex-1 py-1 text-xs font-semibold text-white rounded bg-green-600 hover:bg-green-700 transition-colors flex items-center justify-center gap-1">
                          <Printer size={11} />Print
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}`;

if (content.includes(oldCard)) {
  content = content.replace(oldCard, newCard);
  check('Job cards updated with Phase 1 buttons', true);
} else { check('Job cards updated', false); }

// ── 3. Add onPrintCard prop to JobBoard signature ────────────────────────────
const oldJBSig = "function JobBoard({ jobs, loading, onCardClick, selectedId, onStatusChange }: { jobs: Job[]; loading: boolean; onCardClick: (job: Job) => void; selectedId?: string; onStatusChange: (jobId: string, newStatus: string) => void })";
const newJBSig = "function JobBoard({ jobs, loading, onCardClick, selectedId, onStatusChange, onPrintCard }: { jobs: Job[]; loading: boolean; onCardClick: (job: Job) => void; selectedId?: string; onStatusChange: (jobId: string, newStatus: string) => void; onPrintCard: (job: Job) => void })";
if (!content.includes('onPrintCard')) {
  if (content.includes(oldJBSig)) {
    content = content.replace(oldJBSig, newJBSig);
    check('onPrintCard prop added to JobBoard', true);
  } else { check('onPrintCard prop added', false); }
} else { check('onPrintCard already exists', true); }

// ── 4. Add Printer to lucide imports ────────────────────────────────────────
const oldImp = "ArrowDownToLine, ArrowUpFromLine, X, Mail, FileText, Paperclip, Send, Plus, Check, ChevronRight as Next }";
const newImp = "ArrowDownToLine, ArrowUpFromLine, X, Mail, FileText, Paperclip, Send, Plus, Check, Printer }";
if (!content.includes('Printer')) {
  if (content.includes(oldImp)) {
    content = content.replace(oldImp, newImp);
    check('Printer icon imported', true);
  } else {
    // fallback - try original import line
    const oldImp2 = "ArrowDownToLine, ArrowUpFromLine, X, Mail, FileText, Paperclip, Send, Plus }";
    const newImp2 = "ArrowDownToLine, ArrowUpFromLine, X, Mail, FileText, Paperclip, Send, Plus, Check, Printer }";
    if (content.includes(oldImp2)) {
      content = content.replace(oldImp2, newImp2);
      check('Printer + Check icons imported (fallback)', true);
    } else { check('Printer icon imported', false); }
  }
} else { check('Printer already imported', true); }

// ── 5. Add handlePrintCard stub + wire to JobBoard render ────────────────────
const oldHandler = "  const handleJobStatusChange = async (jobId: string, newStatus: string) => {";
const newHandler = `  const handlePrintJobCard = (job: Job) => {
    // Placeholder - full PDF print coming in next patch
    alert('Print Job Card: ' + (job.job_number || 'New Job') + ' - PDF coming next!')
  }

  const handleJobStatusChange = async (jobId: string, newStatus: string) => {`;
if (!content.includes('handlePrintJobCard')) {
  if (content.includes(oldHandler)) {
    content = content.replace(oldHandler, newHandler);
    check('handlePrintJobCard stub added', true);
  } else { check('handlePrintJobCard stub added', false); }
} else { check('handlePrintJobCard already exists', true); }

// ── 6. Wire onPrintCard to JobBoard render ───────────────────────────────────
const oldRender = "onStatusChange={handleJobStatusChange}";
const newRender = "onStatusChange={handleJobStatusChange} onPrintCard={handlePrintJobCard}";
if (!content.includes('onPrintCard={handlePrintJobCard}')) {
  if (content.includes(oldRender)) {
    content = content.replace(oldRender, newRender);
    check('onPrintCard wired to JobBoard render', true);
  } else { check('onPrintCard wired', false); }
} else { check('onPrintCard already wired', true); }

// ── Write ────────────────────────────────────────────────────────────────────
fs.writeFileSync(filePath, content, 'utf8');
const out = fs.readFileSync(filePath, 'utf8');
console.log('');
console.log('Total lines:', out.split('\n').length);
console.log('PASS:', pass, '| FAIL:', fail);
if (fail === 0) console.log('All good - run: npx vite --force');
else console.log('Fix FAILs before continuing');
