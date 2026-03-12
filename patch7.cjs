const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/App.tsx');
let content = fs.readFileSync(filePath, 'utf8');
let lines = content.split('\n');
console.log('Lines:', lines.length);
let pass = 0; let fail = 0;

function check(name, test) {
  if (test) { console.log('PASS:', name); pass++; }
  else { console.log('FAIL:', name); fail++; }
}

// ── 1. Add entry_type to Job interface ──────────────────────────────────────
const oldJobInterface = '  created_at: string\n}';
const newJobInterface = '  created_at: string\n  entry_type: string | null\n  assigned_employee_name: string | null\n  assigned_supervisor_name: string | null\n  is_contract_work: boolean | null\n  site_req: string | null\n}';
if (!content.includes('entry_type: string | null')) {
  if (content.includes(oldJobInterface)) {
    content = content.replace(oldJobInterface, newJobInterface);
    check('Job interface extended', true);
  } else { check('Job interface extended', false); }
} else { check('Job interface already extended', true); }

// ── 2. Add selectedJob state ─────────────────────────────────────────────────
const oldState = '  const [showCreateDirectJob, setShowCreateDirectJob] = useState(false)';
const newState = '  const [showCreateDirectJob, setShowCreateDirectJob] = useState(false)\n  const [selectedJob, setSelectedJob] = useState<Job | null>(null)';
if (!content.includes('selectedJob, setSelectedJob')) {
  if (content.includes(oldState)) {
    content = content.replace(oldState, newState);
    check('selectedJob state added', true);
  } else { check('selectedJob state added', false); }
} else { check('selectedJob state already exists', true); }

// ── 3. Wire JobBoard onCardClick ─────────────────────────────────────────────
const oldJobBoard = ': <JobBoard jobs={jobs} loading={jobsLoading} onCardClick={setSelectedJob} selectedId={selectedJob?.id}';
if (content.includes(oldJobBoard)) {
  check('JobBoard already wired', true);
} else {
  // Try to find and fix JobBoard render line
  const oldJB = ': <JobBoard jobs={jobs} loading={jobsLoading}';
  const newJB = ': <JobBoard jobs={jobs} loading={jobsLoading} onCardClick={setSelectedJob} selectedId={selectedJob?.id}';
  if (content.includes(oldJB)) {
    content = content.replace(oldJB, newJB);
    check('JobBoard wired', true);
  } else { check('JobBoard wired', false); }
}

// ── 4. Add detail panel overlay render ──────────────────────────────────────
const oldRender = '{showCreateDirectJob && <CreateDirectJobModal onClose={() => setShowCreateDirectJob(false)} onCreated={fetchJobs} />}';
const newRender = '{showCreateDirectJob && <CreateDirectJobModal onClose={() => setShowCreateDirectJob(false)} onCreated={fetchJobs} />}\n      {selectedJob && <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"><JobDetailPanel job={selectedJob} onClose={() => setSelectedJob(null)} onUpdate={(j) => { setSelectedJob(j); fetchJobs() }} /></div>}';
if (!content.includes('JobDetailPanel')) {
  if (content.includes(oldRender)) {
    content = content.replace(oldRender, newRender);
    check('Detail panel render added', true);
  } else { check('Detail panel render added', false); }
} else { check('Detail panel render already exists', true); }

// ── 5. Insert JobDetailPanel component before // CREATE DIRECT JOB MODAL ────
const jobDetailComponent = `
// JOB DETAIL PANEL

function JobDetailPanel({ job, onClose, onUpdate }: { job: Job; onClose: () => void; onUpdate: (j: Job) => void }) {
  const [saving, setSaving] = React.useState(false)
  const [status, setStatus] = React.useState(job.status)
  const [priority, setPriority] = React.useState(job.priority || 'NORMAL')
  const [assignedEmployee, setAssignedEmployee] = React.useState(job.assigned_employee_name || '')
  const [assignedSupervisor, setAssignedSupervisor] = React.useState(job.assigned_supervisor_name || '')
  const [notes, setNotes] = React.useState(job.notes || '')
  const [msg, setMsg] = React.useState('')
  const [lineItems, setLineItems] = React.useState<any[]>([])

  React.useEffect(() => {
    supabase.from('job_line_items').select('*').eq('job_id', job.id).order('sort_order').then(({ data }) => {
      if (data) setLineItems(data)
    })
  }, [job.id])

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data, error } = await supabase.from('jobs').update({
        status,
        priority,
        assigned_employee_name: assignedEmployee || null,
        assigned_supervisor_name: assignedSupervisor || null,
        notes: notes || null,
      }).eq('id', job.id).select().single()
      if (error) throw error
      onUpdate(data)
      showMsg('Saved successfully')
    } catch (err: any) {
      showMsg('Error: ' + err.message)
    } finally { setSaving(false) }
  }

  const statusOptions = ['PENDING','SCHEDULED','IN_PROGRESS','ON_HOLD','QUALITY_CHECK','COMPLETE']
  const statusColors: Record<string,string> = {
    PENDING: 'bg-gray-100 text-gray-700',
    SCHEDULED: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-orange-100 text-orange-700',
    ON_HOLD: 'bg-red-100 text-red-700',
    QUALITY_CHECK: 'bg-purple-100 text-purple-700',
    COMPLETE: 'bg-green-100 text-green-700',
  }

  return (
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
      <div className="bg-green-600 text-white px-6 py-4 rounded-t-xl flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold">{job.job_number || 'New Job'}</h2>
            {job.entry_type === 'DIRECT' && <span className="text-xs font-bold px-2 py-0.5 bg-orange-400 text-white rounded">DIRECT</span>}
            {job.is_emergency && <span className="text-xs font-bold px-2 py-0.5 bg-red-500 text-white rounded">EMERGENCY</span>}
          </div>
          <p className="text-green-200 text-xs mt-0.5">{job.client_name || 'No client'}</p>
        </div>
        <button onClick={onClose} className="text-green-200 hover:text-white"><X size={20} /></button>
      </div>
      <div className="overflow-y-auto flex-1 p-6 space-y-5">
        {msg && <div className="px-4 py-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">{msg}</div>}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              {statusOptions.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
            <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {job.site_req && <div><span className="text-xs text-gray-500 block">Site Req / PO</span><span className="font-medium">{job.site_req}</span></div>}
          {job.rfq_no && <div><span className="text-xs text-gray-500 block">Work Order No</span><span className="font-medium text-blue-600">{job.rfq_no}</span></div>}
          {job.due_date && <div><span className="text-xs text-gray-500 block">Due Date</span><span className="font-medium">{new Date(job.due_date).toLocaleDateString('en-ZA')}</span></div>}
          {job.created_at && <div><span className="text-xs text-gray-500 block">Created</span><span className="font-medium">{new Date(job.created_at).toLocaleDateString('en-ZA')}</span></div>}
        </div>

        {job.description && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <p className="text-sm text-gray-800 bg-gray-50 rounded-lg px-3 py-2">{job.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Assigned Employee</label>
            <input value={assignedEmployee} onChange={e => setAssignedEmployee(e.target.value)} placeholder="Employee name..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Supervisor</label>
            <input value={assignedSupervisor} onChange={e => setAssignedSupervisor(e.target.value)} placeholder="Supervisor..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>

        {lineItems.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Line Items</label>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">#</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Description</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium w-14">Qty</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium w-16">UOM</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, i) => (
                    <tr key={item.id} className="border-t border-gray-100">
                      <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                      <td className="px-3 py-2 text-gray-800">{item.description}</td>
                      <td className="px-3 py-2 text-gray-600">{item.quantity}</td>
                      <td className="px-3 py-2 text-gray-600">{item.uom}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Notes..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">Close</button>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
          <Check size={14} />{saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

`;

if (!content.includes('function JobDetailPanel')) {
  const insertPoint = '// CREATE DIRECT JOB MODAL';
  if (content.includes(insertPoint)) {
    content = content.replace(insertPoint, jobDetailComponent + insertPoint);
    check('JobDetailPanel component inserted', true);
  } else { check('JobDetailPanel component inserted', false); }
} else { check('JobDetailPanel already exists', true); }

// ── Write & verify ───────────────────────────────────────────────────────────
fs.writeFileSync(filePath, content, 'utf8');
const out = fs.readFileSync(filePath, 'utf8');
console.log('');
console.log('Final line count:', out.split('\n').length);
console.log('PASS:', pass, '| FAIL:', fail);
if (fail === 0) console.log('All good - run: npx vite --force');
else console.log('Fix FAILs before running Vite');
