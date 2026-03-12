const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/App.tsx');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');
console.log('Baseline lines:', lines.length);
if (lines.length > 1250) { console.log('ERROR: File not at clean baseline - run: git checkout f029372 -- src/App.tsx'); process.exit(1); }

function findLine(pattern, from = 0) {
  for (let i = from; i < lines.length; i++) {
    if (lines[i].includes(pattern)) return i;
  }
  return -1;
}

// ═══════════════════════════════════════════════════════════════
// 1. LUCIDE IMPORTS - add Check + Printer
// ═══════════════════════════════════════════════════════════════
lines[2] = `import { ClipboardList, Briefcase, ChevronRight, Factory, Building2, Calendar, Hash, RefreshCw, ArrowDownToLine, ArrowUpFromLine, X, Mail, FileText, Paperclip, Send, Plus, Check, Printer } from 'lucide-react'`;
console.log('1. PASS: lucide imports updated');

// ═══════════════════════════════════════════════════════════════
// 2. EXTEND Job INTERFACE - add entry_type + extra fields
// ═══════════════════════════════════════════════════════════════
const jobInterfaceEnd = findLine('  created_at: string');
if (jobInterfaceEnd >= 0) {
  lines.splice(jobInterfaceEnd + 1, 0,
    '  entry_type: string | null',
    '  assigned_employee_name: string | null',
    '  assigned_supervisor_name: string | null',
    '  is_contract_work: boolean | null',
    '  site_req: string | null'
  );
  console.log('2. PASS: Job interface extended');
} else { console.log('2. FAIL: Job interface end not found'); process.exit(1); }

// ═══════════════════════════════════════════════════════════════
// 3. ADD STATE: showCreateDirectJob + selectedJob
// ═══════════════════════════════════════════════════════════════
const showCreateIdx = findLine('const [showCreateModal, setShowCreateModal] = useState(false)');
if (showCreateIdx >= 0) {
  lines.splice(showCreateIdx + 1, 0,
    '  const [showCreateDirectJob, setShowCreateDirectJob] = useState(false)',
    '  const [selectedJob, setSelectedJob] = useState<Job | null>(null)'
  );
  console.log('3. PASS: state added');
} else { console.log('3. FAIL: showCreateModal state not found'); process.exit(1); }

// ═══════════════════════════════════════════════════════════════
// 4. ADD HANDLERS before fetchJobs
// ═══════════════════════════════════════════════════════════════
const fetchJobsIdx = findLine('const fetchJobs = async');
if (fetchJobsIdx >= 0) {
  lines.splice(fetchJobsIdx, 0,
    '  const handlePrintJobCard = (job: Job) => {',
    "    alert('Print Job Card: ' + (job.job_number || 'New Job') + ' - PDF coming next!')",
    '  }',
    '',
    '  const handleJobStatusChange = async (jobId: string, newStatus: string) => {',
    "    await supabase.from('jobs').update({ status: newStatus }).eq('id', jobId)",
    '    fetchJobs()',
    '  }',
    ''
  );
  console.log('4. PASS: handlers added');
} else { console.log('4. FAIL: fetchJobs not found'); process.exit(1); }

// ═══════════════════════════════════════════════════════════════
// 5. ADD "New Job" BUTTON after rfq button block
// ═══════════════════════════════════════════════════════════════
const newWOBtn = findLine('<Plus size={15} />New Work Order');
if (newWOBtn >= 0) {
  // closing )} of the rfq button block is 2 lines after
  const closingIdx = findLine('            )}', newWOBtn);
  if (closingIdx >= 0) {
    lines.splice(closingIdx + 1, 0,
      "            {activeBoard === 'job' && (",
      "              <button onClick={() => setShowCreateDirectJob(true)} className=\"flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors\">",
      "                <Plus size={15} />New Job",
      "              </button>",
      "            )}"
    );
    console.log('5. PASS: New Job button added');
  } else { console.log('5. FAIL: closing )} not found'); process.exit(1); }
} else { console.log('5. FAIL: New Work Order button not found'); process.exit(1); }

// ═══════════════════════════════════════════════════════════════
// 6. WIRE JobBoard render
// ═══════════════════════════════════════════════════════════════
const jbRenderIdx = findLine(': <JobBoard jobs={jobs}');
if (jbRenderIdx >= 0) {
  lines[jbRenderIdx] = lines[jbRenderIdx]
    .replace(': <JobBoard jobs={jobs} loading={jobsLoading}',
             ': <JobBoard jobs={jobs} loading={jobsLoading} onCardClick={setSelectedJob} selectedId={selectedJob?.id} onStatusChange={handleJobStatusChange} onPrintCard={handlePrintJobCard}');
  console.log('6. PASS: JobBoard render wired');
} else { console.log('6. FAIL: JobBoard render not found'); process.exit(1); }

// ═══════════════════════════════════════════════════════════════
// 7. ADD MODAL RENDERS
// ═══════════════════════════════════════════════════════════════
const showCreateRender = findLine('{showCreateModal && <CreateRFQModal');
if (showCreateRender >= 0) {
  lines.splice(showCreateRender + 1, 0,
    "      {showCreateDirectJob && <CreateDirectJobModal onClose={() => setShowCreateDirectJob(false)} onCreated={fetchJobs} />}",
    "      {selectedJob && <div className=\"fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4\"><JobDetailPanel job={selectedJob} onClose={() => setSelectedJob(null)} onUpdate={(j) => { setSelectedJob(j); fetchJobs() }} /></div>}"
  );
  console.log('7. PASS: modal renders added');
} else { console.log('7. FAIL: CreateRFQModal render not found'); process.exit(1); }

// ═══════════════════════════════════════════════════════════════
// 8. REPLACE JobBoard function (signature + columns + cards)
// ═══════════════════════════════════════════════════════════════
const jbFuncIdx = findLine('function JobBoard({');
if (jbFuncIdx >= 0) {
  // Find end of JobBoard - the closing } before // CREATE RFQ MODAL
  const createRFQIdx = findLine('// CREATE RFQ MODAL', jbFuncIdx);
  // Find the last } before that comment
  let jbEnd = createRFQIdx - 1;
  while (jbEnd > jbFuncIdx && lines[jbEnd].trim() === '') jbEnd--;
  
  const newJobBoard = [
    "function JobBoard({ jobs, loading, onCardClick, selectedId, onStatusChange, onPrintCard }: { jobs: Job[]; loading: boolean; onCardClick: (job: Job) => void; selectedId?: string; onStatusChange: (jobId: string, newStatus: string) => void; onPrintCard: (job: Job) => void }) {",
    "  const columns = [",
    "    { key: 'PENDING',        label: 'Pending',        color: 'bg-gray-500'  },",
    "    { key: 'IN_REVIEW',      label: 'In Review',      color: 'bg-blue-500'  },",
    "    { key: 'READY_TO_PRINT', label: 'Ready to Print', color: 'bg-amber-500' },",
    "    { key: 'PRINTED',        label: 'Printed',        color: 'bg-green-600' },",
    "  ]",
    "  if (loading) return (",
    "    <div className=\"flex items-center justify-center h-64 gap-3 text-gray-400\">",
    "      <div className=\"w-5 h-5 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin\" />",
    "      <span>Loading jobs...</span>",
    "    </div>",
    "  )",
    "  return (",
    "    <div className=\"flex gap-4 h-full\" style={{ minWidth: 'max-content' }}>",
    "      {columns.map(col => {",
    "        const cards = jobs.filter(j => j.status === col.key)",
    "        return (",
    "          <div key={col.key} className=\"w-64 flex flex-col shrink-0\">",
    "            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-t-lg ${col.color}`}>",
    "              <span className=\"text-white text-sm font-bold\">{col.label}</span>",
    "              <span className=\"ml-auto bg-white bg-opacity-25 text-white text-xs font-bold px-2 py-0.5 rounded-full\">{cards.length}</span>",
    "            </div>",
    "            <div className=\"flex-1 bg-gray-200 rounded-b-lg p-2 min-h-96 space-y-2\">",
    "              {cards.length === 0 && (",
    "                <div className=\"flex items-center justify-center h-20\">",
    "                  <p className=\"text-gray-400 text-xs\">No jobs</p>",
    "                </div>",
    "              )}",
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
    "                            className=\"flex items-center justify-center gap-1 flex-1 py-1 text-xs font-semibold text-white rounded bg-green-600 hover:bg-green-700 transition-colors\">",
    "                            <Printer size={11} />Print",
    "                          </button>",
    "                        )}",
    "                      </div>",
    "                    )}",
    "                  </div>",
    "                )",
    "              })}",
    "            </div>",
    "          </div>",
    "        )",
    "      })}",
    "    </div>",
    "  )",
    "}",
    ""
  ];
  lines.splice(jbFuncIdx, jbEnd - jbFuncIdx + 1, ...newJobBoard);
  console.log('8. PASS: JobBoard replaced');
} else { console.log('8. FAIL: JobBoard function not found'); process.exit(1); }

// ═══════════════════════════════════════════════════════════════
// 9. INSERT JobDetailPanel + CreateDirectJobModal before // CREATE RFQ MODAL
// ═══════════════════════════════════════════════════════════════
const insertIdx = findLine('// CREATE RFQ MODAL');
if (insertIdx >= 0) {
  const components = [
"// JOB DETAIL PANEL",
"",
"function JobDetailPanel({ job, onClose, onUpdate }: { job: Job; onClose: () => void; onUpdate: (j: Job) => void }) {",
"  const [saving, setSaving] = React.useState(false)",
"  const [status, setStatus] = React.useState(job.status)",
"  const [priority, setPriority] = React.useState(job.priority || 'NORMAL')",
"  const [assignedEmployee, setAssignedEmployee] = React.useState(job.assigned_employee_name || '')",
"  const [assignedSupervisor, setAssignedSupervisor] = React.useState(job.assigned_supervisor_name || '')",
"  const [notes, setNotes] = React.useState(job.notes || '')",
"  const [msg, setMsg] = React.useState('')",
"  const [lineItems, setLineItems] = React.useState<any[]>([])",
"",
"  React.useEffect(() => {",
"    supabase.from('job_line_items').select('*').eq('job_id', job.id).order('sort_order').then(({ data }) => {",
"      if (data) setLineItems(data)",
"    })",
"  }, [job.id])",
"",
"  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }",
"",
"  const handleSave = async () => {",
"    setSaving(true)",
"    try {",
"      const { data, error } = await supabase.from('jobs').update({",
"        status, priority,",
"        assigned_employee_name: assignedEmployee || null,",
"        assigned_supervisor_name: assignedSupervisor || null,",
"        notes: notes || null,",
"      }).eq('id', job.id).select().single()",
"      if (error) throw error",
"      onUpdate(data)",
"      showMsg('Saved successfully')",
"    } catch (err: any) {",
"      showMsg('Error: ' + err.message)",
"    } finally { setSaving(false) }",
"  }",
"",
"  const statusOptions = ['PENDING','IN_REVIEW','READY_TO_PRINT','PRINTED']",
"",
"  return (",
"    <div className=\"bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]\">",
"      <div className=\"bg-green-600 text-white px-6 py-4 rounded-t-xl flex items-center justify-between shrink-0\">",
"        <div>",
"          <div className=\"flex items-center gap-3\">",
"            <h2 className=\"text-lg font-bold\">{job.job_number || 'New Job'}</h2>",
"            {job.entry_type === 'DIRECT' && <span className=\"text-xs font-bold px-2 py-0.5 bg-orange-400 text-white rounded\">DIRECT</span>}",
"            {job.is_emergency && <span className=\"text-xs font-bold px-2 py-0.5 bg-red-500 text-white rounded\">EMERGENCY</span>}",
"          </div>",
"          <p className=\"text-green-200 text-xs mt-0.5\">{job.client_name || 'No client'}</p>",
"        </div>",
"        <button onClick={onClose} className=\"text-green-200 hover:text-white\"><X size={20} /></button>",
"      </div>",
"      <div className=\"overflow-y-auto flex-1 p-6 space-y-5\">",
"        {msg && <div className=\"px-4 py-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg\">{msg}</div>}",
"        <div className=\"grid grid-cols-2 gap-4\">",
"          <div>",
"            <label className=\"block text-xs font-medium text-gray-500 mb-1\">Status</label>",
"            <select value={status} onChange={e => setStatus(e.target.value)} className=\"w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500\">",
"              {statusOptions.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}",
"            </select>",
"          </div>",
"          <div>",
"            <label className=\"block text-xs font-medium text-gray-500 mb-1\">Priority</label>",
"            <select value={priority} onChange={e => setPriority(e.target.value)} className=\"w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500\">",
"              <option value=\"LOW\">Low</option>",
"              <option value=\"NORMAL\">Normal</option>",
"              <option value=\"HIGH\">High</option>",
"              <option value=\"URGENT\">Urgent</option>",
"            </select>",
"          </div>",
"        </div>",
"        <div className=\"grid grid-cols-2 gap-4 text-sm\">",
"          {job.site_req && <div><span className=\"text-xs text-gray-500 block\">Site Req / PO</span><span className=\"font-medium\">{job.site_req}</span></div>}",
"          {job.rfq_no && <div><span className=\"text-xs text-gray-500 block\">Work Order No</span><span className=\"font-medium text-blue-600\">{job.rfq_no}</span></div>}",
"          {job.due_date && <div><span className=\"text-xs text-gray-500 block\">Due Date</span><span className=\"font-medium\">{new Date(job.due_date).toLocaleDateString('en-ZA')}</span></div>}",
"          {job.created_at && <div><span className=\"text-xs text-gray-500 block\">Created</span><span className=\"font-medium\">{new Date(job.created_at).toLocaleDateString('en-ZA')}</span></div>}",
"        </div>",
"        {job.description && (",
"          <div>",
"            <label className=\"block text-xs font-medium text-gray-500 mb-1\">Description</label>",
"            <p className=\"text-sm text-gray-800 bg-gray-50 rounded-lg px-3 py-2\">{job.description}</p>",
"          </div>",
"        )}",
"        <div className=\"grid grid-cols-2 gap-4\">",
"          <div>",
"            <label className=\"block text-xs font-medium text-gray-500 mb-1\">Assigned Employee</label>",
"            <input value={assignedEmployee} onChange={e => setAssignedEmployee(e.target.value)} placeholder=\"Employee name...\" className=\"w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500\" />",
"          </div>",
"          <div>",
"            <label className=\"block text-xs font-medium text-gray-500 mb-1\">Supervisor</label>",
"            <input value={assignedSupervisor} onChange={e => setAssignedSupervisor(e.target.value)} placeholder=\"Supervisor...\" className=\"w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500\" />",
"          </div>",
"        </div>",
"        {lineItems.length > 0 && (",
"          <div>",
"            <label className=\"block text-xs font-medium text-gray-500 mb-2\">Line Items</label>",
"            <div className=\"border border-gray-200 rounded-lg overflow-hidden\">",
"              <table className=\"w-full text-xs\">",
"                <thead className=\"bg-gray-50\"><tr>",
"                  <th className=\"px-3 py-2 text-left text-gray-500 font-medium\">#</th>",
"                  <th className=\"px-3 py-2 text-left text-gray-500 font-medium\">Description</th>",
"                  <th className=\"px-3 py-2 text-left text-gray-500 font-medium w-14\">Qty</th>",
"                  <th className=\"px-3 py-2 text-left text-gray-500 font-medium w-16\">UOM</th>",
"                </tr></thead>",
"                <tbody>",
"                  {lineItems.map((item, i) => (",
"                    <tr key={item.id} className=\"border-t border-gray-100\">",
"                      <td className=\"px-3 py-2 text-gray-400\">{i + 1}</td>",
"                      <td className=\"px-3 py-2 text-gray-800\">{item.description}</td>",
"                      <td className=\"px-3 py-2 text-gray-600\">{item.quantity}</td>",
"                      <td className=\"px-3 py-2 text-gray-600\">{item.uom}</td>",
"                    </tr>",
"                  ))}",
"                </tbody>",
"              </table>",
"            </div>",
"          </div>",
"        )}",
"        <div>",
"          <label className=\"block text-xs font-medium text-gray-500 mb-1\">Notes</label>",
"          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder=\"Notes...\" className=\"w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none\" />",
"        </div>",
"      </div>",
"      <div className=\"flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0\">",
"        <button onClick={onClose} className=\"px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors\">Close</button>",
"        <button onClick={handleSave} disabled={saving} className=\"flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors\">",
"          <Check size={14} />{saving ? 'Saving...' : 'Save Changes'}",
"        </button>",
"      </div>",
"    </div>",
"  )",
"}",
"",
"// CREATE DIRECT JOB MODAL",
"",
"function CreateDirectJobModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {",
"  const [saving, setSaving] = React.useState(false)",
"  const [clientName, setClientName] = React.useState('')",
"  const [siteReq, setSiteReq] = React.useState('')",
"  const [workType, setWorkType] = React.useState<'contract' | 'quoted'>('contract')",
"  const [priority, setPriority] = React.useState('NORMAL')",
"  const [compiledBy, setCompiledBy] = React.useState('')",
"  const [isEmergency, setIsEmergency] = React.useState(false)",
"  const [assignedEmployee, setAssignedEmployee] = React.useState('')",
"  const [assignedSupervisor, setAssignedSupervisor] = React.useState('')",
"  const [notes, setNotes] = React.useState('')",
"  const [dateReceived] = React.useState(new Date().toISOString().split('T')[0])",
"  const [dueDate, setDueDate] = React.useState('')",
"  const [hasDrawing, setHasDrawing] = React.useState(false)",
"  const [actions, setActions] = React.useState({ manufacture: false, sandblast: false, prepare_material: false, service: false, paint: false, other: false, repair: false, installation: false, cut: false, modify: false })",
"  const [lineItems, setLineItems] = React.useState([{ description: '', quantity: 1, uom: 'Each', notes: '' }])",
"",
"  const toggleAction = (key: keyof typeof actions) => setActions(a => ({ ...a, [key]: !a[key] }))",
"  const addLineItem = () => setLineItems(li => [...li, { description: '', quantity: 1, uom: 'Each', notes: '' }])",
"  const removeLineItem = (i: number) => setLineItems(li => li.filter((_, idx) => idx !== i))",
"  const updateLineItem = (i: number, field: string, val: any) => setLineItems(li => li.map((item, idx) => idx === i ? { ...item, [field]: val } : item))",
"",
"  const handleCreate = async () => {",
"    if (!clientName.trim()) { alert('Client name is required'); return }",
"    if (!dueDate) { alert('Due date is required'); return }",
"    setSaving(true)",
"    try {",
"      const { data: job, error } = await supabase.from('jobs').insert({",
"        client_name: clientName.trim(), site_req: siteReq.trim() || null,",
"        is_contract_work: workType === 'contract', is_quoted_work: workType === 'quoted',",
"        priority, compiled_by: compiledBy.trim() || null, is_emergency: isEmergency,",
"        assigned_employee_name: assignedEmployee.trim() || null,",
"        assigned_supervisor_name: assignedSupervisor.trim() || null,",
"        notes: notes.trim() || null, date_received: dateReceived, due_date: dueDate,",
"        has_drawing: hasDrawing,",
"        action_manufacture: actions.manufacture, action_sandblast: actions.sandblast,",
"        action_prepare_material: actions.prepare_material, action_service: actions.service,",
"        action_paint: actions.paint, action_other: actions.other, action_repair: actions.repair,",
"        action_installation: actions.installation, action_cut: actions.cut, action_modify: actions.modify,",
"        entry_type: 'DIRECT', status: 'PENDING',",
"      }).select().single()",
"      if (error) throw error",
"      const validItems = lineItems.filter(l => l.description.trim())",
"      if (validItems.length > 0) {",
"        await supabase.from('job_line_items').insert(",
"          validItems.map((item, idx) => ({",
"            job_id: job.id, description: item.description.trim(),",
"            quantity: item.quantity, uom: item.uom,",
"            specification: item.notes.trim() || null, sort_order: idx,",
"            status: 'PENDING', cost_price: 0, sell_price: 0, line_total: 0, can_spawn_job: true,",
"          }))",
"        )",
"      }",
"      onCreated()",
"    } catch (err: any) { alert('Error: ' + err.message) }",
"    finally { setSaving(false) }",
"  }",
"",
"  const uomOptions = ['Each', 'Meter', 'kg', 'Liter', 'Hour', 'Set', 'm2', 'm3']",
"  const actionList = [",
"    { key: 'manufacture' as const, label: 'Manufacture' }, { key: 'sandblast' as const, label: 'Sandblast' },",
"    { key: 'prepare_material' as const, label: 'Prepare Material' }, { key: 'service' as const, label: 'Service' },",
"    { key: 'paint' as const, label: 'Paint' }, { key: 'other' as const, label: 'Other' },",
"    { key: 'repair' as const, label: 'Repair' }, { key: 'installation' as const, label: 'Installation' },",
"    { key: 'cut' as const, label: 'Cut' }, { key: 'modify' as const, label: 'Modify' },",
"  ]",
"",
"  return (",
"    <div className=\"fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4\">",
"      <div className=\"bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]\">",
"        <div className=\"bg-indigo-600 text-white px-6 py-4 rounded-t-xl flex items-center justify-between shrink-0\">",
"          <div><h2 className=\"text-lg font-bold\">Create New Job</h2><p className=\"text-indigo-200 text-xs mt-0.5\">Direct Work Order (No RFQ)</p></div>",
"          <button onClick={onClose} className=\"text-indigo-200 hover:text-white\"><X size={20} /></button>",
"        </div>",
"        <div className=\"overflow-y-auto flex-1 p-6 space-y-5\">",
"          <div className=\"grid grid-cols-3 gap-4\">",
"            <div><label className=\"block text-xs font-medium text-gray-600 mb-1\">Client *</label><input value={clientName} onChange={e => setClientName(e.target.value)} placeholder=\"Client name...\" className=\"w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500\" /></div>",
"            <div><label className=\"block text-xs font-medium text-gray-600 mb-1\">Site Req / PO</label><input value={siteReq} onChange={e => setSiteReq(e.target.value)} placeholder=\"e.g. PO-12345\" className=\"w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500\" /></div>",
"            <div><label className=\"block text-xs font-medium text-gray-600 mb-1\">Due Date *</label><input type=\"date\" value={dueDate} onChange={e => setDueDate(e.target.value)} className=\"w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500\" /></div>",
"          </div>",
"          <div className=\"grid grid-cols-4 gap-4 items-end\">",
"            <div><label className=\"block text-xs font-medium text-gray-600 mb-1\">Work Type</label>",
"              <div className=\"flex rounded-lg overflow-hidden border border-gray-300\">",
"                <button onClick={() => setWorkType('contract')} className={'flex-1 py-2 text-xs font-semibold transition-colors ' + (workType === 'contract' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}>Contract</button>",
"                <button onClick={() => setWorkType('quoted')} className={'flex-1 py-2 text-xs font-semibold transition-colors ' + (workType === 'quoted' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}>Quoted</button>",
"              </div>",
"            </div>",
"            <div><label className=\"block text-xs font-medium text-gray-600 mb-1\">Priority</label><select value={priority} onChange={e => setPriority(e.target.value)} className=\"w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500\"><option value=\"LOW\">Low</option><option value=\"NORMAL\">Normal</option><option value=\"HIGH\">High</option><option value=\"URGENT\">Urgent</option></select></div>",
"            <div><label className=\"block text-xs font-medium text-gray-600 mb-1\">Compiled By</label><input value={compiledBy} onChange={e => setCompiledBy(e.target.value)} placeholder=\"Name...\" className=\"w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500\" /></div>",
"            <div className=\"flex items-center gap-2 pb-2\"><input type=\"checkbox\" id=\"djEmergency\" checked={isEmergency} onChange={e => setIsEmergency(e.target.checked)} className=\"w-4 h-4 text-red-600\" /><label htmlFor=\"djEmergency\" className=\"text-sm font-medium text-red-600\">Emergency</label></div>",
"          </div>",
"          <div className=\"grid grid-cols-2 gap-4\">",
"            <div><label className=\"block text-xs font-medium text-gray-600 mb-1\">Assigned Employee</label><input value={assignedEmployee} onChange={e => setAssignedEmployee(e.target.value)} placeholder=\"Employee name...\" className=\"w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500\" /></div>",
"            <div><label className=\"block text-xs font-medium text-gray-600 mb-1\">Supervisor</label><input value={assignedSupervisor} onChange={e => setAssignedSupervisor(e.target.value)} placeholder=\"Supervisor name...\" className=\"w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500\" /></div>",
"          </div>",
"          <div>",
"            <label className=\"block text-xs font-medium text-gray-600 mb-2\">Actions Required</label>",
"            <div className=\"grid grid-cols-5 gap-2\">",
"              {actionList.map(({ key, label }) => (",
"                <label key={key} className=\"flex items-center gap-2 text-sm cursor-pointer\">",
"                  <input type=\"checkbox\" checked={actions[key]} onChange={() => toggleAction(key)} className=\"w-4 h-4 text-indigo-600 rounded\" />",
"                  <span className=\"text-gray-700\">{label}</span>",
"                </label>",
"              ))}",
"            </div>",
"          </div>",
"          <div>",
"            <div className=\"flex items-center justify-between mb-2\">",
"              <label className=\"text-xs font-medium text-gray-600\">Line Items</label>",
"              <button onClick={addLineItem} className=\"text-xs text-indigo-600 hover:underline font-medium\">+ Add Item</button>",
"            </div>",
"            <div className=\"border border-gray-200 rounded-lg overflow-hidden\">",
"              <table className=\"w-full text-xs\">",
"                <thead className=\"bg-gray-50\"><tr><th className=\"px-2 py-2 text-left text-gray-500 font-medium\">#</th><th className=\"px-2 py-2 text-left text-gray-500 font-medium\">Description</th><th className=\"px-2 py-2 text-left text-gray-500 font-medium w-16\">Qty</th><th className=\"px-2 py-2 text-left text-gray-500 font-medium w-20\">UOM</th><th className=\"w-6\"></th></tr></thead>",
"                <tbody>",
"                  {lineItems.map((item, i) => (",
"                    <tr key={i} className=\"border-t border-gray-100\">",
"                      <td className=\"px-2 py-1.5 text-gray-400\">{i + 1}</td>",
"                      <td className=\"px-2 py-1.5\"><input value={item.description} onChange={e => updateLineItem(i, 'description', e.target.value)} placeholder=\"Description\" className=\"w-full border-0 focus:outline-none text-xs\" /></td>",
"                      <td className=\"px-2 py-1.5\"><input type=\"number\" value={item.quantity} onChange={e => updateLineItem(i, 'quantity', Number(e.target.value))} min={1} className=\"w-full border border-gray-200 rounded px-1 py-0.5 text-xs\" /></td>",
"                      <td className=\"px-2 py-1.5\"><select value={item.uom} onChange={e => updateLineItem(i, 'uom', e.target.value)} className=\"w-full border border-gray-200 rounded px-1 py-0.5 text-xs\">{uomOptions.map(u => <option key={u}>{u}</option>)}</select></td>",
"                      <td className=\"px-2 py-1.5 text-center\">{lineItems.length > 1 && <button onClick={() => removeLineItem(i)} className=\"text-red-400 hover:text-red-600\"><X size={12} /></button>}</td>",
"                    </tr>",
"                  ))}",
"                </tbody>",
"              </table>",
"            </div>",
"          </div>",
"          <div className=\"flex items-center gap-2\"><input type=\"checkbox\" id=\"djDrawing\" checked={hasDrawing} onChange={e => setHasDrawing(e.target.checked)} className=\"w-4 h-4\" /><label htmlFor=\"djDrawing\" className=\"text-sm text-gray-700\">Drawing / Sketches Attached</label></div>",
"          <div><label className=\"block text-xs font-medium text-gray-600 mb-1\">Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder=\"Additional notes...\" className=\"w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none\" /></div>",
"        </div>",
"        <div className=\"flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0\">",
"          <button onClick={onClose} className=\"px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors\">Cancel</button>",
"          <button onClick={handleCreate} disabled={saving} className=\"flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors\">",
"            <Briefcase size={14} />{saving ? 'Creating...' : 'Create Job'}",
"          </button>",
"        </div>",
"      </div>",
"    </div>",
"  )",
"}",
""
  ];
  lines.splice(insertIdx, 0, ...components);
  console.log('9. PASS: JobDetailPanel + CreateDirectJobModal inserted');
} else { console.log('9. FAIL: // CREATE RFQ MODAL not found'); process.exit(1); }

// ═══════════════════════════════════════════════════════════════
// WRITE + VERIFY
// ═══════════════════════════════════════════════════════════════
fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
const out = fs.readFileSync(filePath, 'utf8');
console.log('');
console.log('Total lines:', out.split('\n').length);
const checks = [
  'Printer', 'Check',
  'entry_type: string | null',
  'showCreateDirectJob',
  'selectedJob',
  'handlePrintJobCard',
  'handleJobStatusChange',
  'IN_REVIEW', 'READY_TO_PRINT', 'PRINTED',
  'function JobDetailPanel',
  'function CreateDirectJobModal',
  'onStatusChange={handleJobStatusChange}',
  'onPrintCard={handlePrintJobCard}',
];
let allPass = true;
checks.forEach(c => {
  const ok = out.includes(c);
  console.log((ok ? 'PASS' : 'FAIL') + ': ' + c);
  if (!ok) allPass = false;
});
console.log('');
console.log(allPass ? 'ALL PASS - run: npx vite --force' : 'SOME FAILED - do not run Vite yet');
