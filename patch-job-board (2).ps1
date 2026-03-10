# patch-job-board.ps1
# Adds JobBoard, JobCard, CreateJobModal, JobDetailPanel directly into App.tsx
# Run from project root: powershell -ExecutionPolicy Bypass -File patch-job-board.ps1

$f = "src\App.tsx"
if (-not (Test-Path $f)) { Write-Host "ERROR: App.tsx not found" -ForegroundColor Red; exit 1 }

$content = [System.IO.File]::ReadAllText($f)
Write-Host "Current lines: $(($content -split "`n").Count)" -ForegroundColor Cyan

# Step 1: Add Job interface before RFQ_COLUMNS
$jobInterface = @'

interface Job {
  id: string
  job_number: string | null
  rfq_id: string | null
  rfq_no: string | null
  enq_number: string | null
  client_name: string | null
  description: string | null
  status: string
  priority: string
  work_type: string | null
  po_number: string | null
  assigned_to: string | null
  supervisor: string | null
  is_emergency: boolean
  due_date: string | null
  material_ordered_date: string | null
  completion_date: string | null
  notes: string | null
  created_at: string
}

'@

if ($content -notmatch 'interface Job \{') {
  $content = $content.Replace('const RFQ_COLUMNS', $jobInterface + 'const RFQ_COLUMNS')
  Write-Host "Added Job interface" -ForegroundColor Green
} else { Write-Host "Job interface already exists" -ForegroundColor Yellow }

# Step 2: Add JOB_COLUMNS after RFQ_COLUMNS block
$jobColumns = @'

const JOB_COLUMNS = [
  { key: 'PENDING',       label: 'Pending',       color: 'bg-gray-500',   hover: 'hover:border-gray-300'   },
  { key: 'SCHEDULED',     label: 'Scheduled',     color: 'bg-blue-500',   hover: 'hover:border-blue-300'   },
  { key: 'IN_PROGRESS',   label: 'In Progress',   color: 'bg-orange-500', hover: 'hover:border-orange-300' },
  { key: 'ON_HOLD',       label: 'On Hold',       color: 'bg-red-400',    hover: 'hover:border-red-300'    },
  { key: 'QUALITY_CHECK', label: 'Quality Check', color: 'bg-purple-500', hover: 'hover:border-purple-300' },
  { key: 'COMPLETE',      label: 'Complete',      color: 'bg-green-500',  hover: 'hover:border-green-300'  },
]

const WORKERS = ['Dewald', 'Jaco', 'Hendrik', 'Juanic', 'Workshop Team']
const SUPERVISORS = ['Hendrik', 'Juanic', 'Wessie']

'@

if ($content -notmatch 'const JOB_COLUMNS') {
  $content = $content.Replace('const PRIORITY_BADGE', $jobColumns + 'const PRIORITY_BADGE')
  Write-Host "Added JOB_COLUMNS" -ForegroundColor Green
} else { Write-Host "JOB_COLUMNS already exists" -ForegroundColor Yellow }

# Step 3: Add jobs state to App()
$oldState = 'const [showCreateModal, setShowCreateModal] = useState<boolean>(false)'
$newState = 'const [showCreateModal, setShowCreateModal] = useState<boolean>(false)'
# Try alternate form
if ($content -notmatch 'setJobs') {
  $content = $content.Replace(
    'const [showCreateModal, setShowCreateModal] = useState(false)',
    'const [showCreateModal, setShowCreateModal] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)'
  )
  Write-Host "Added jobs state" -ForegroundColor Green
} else { Write-Host "Jobs state already exists" -ForegroundColor Yellow }

# Step 4: Add fetchJobs
if ($content -notmatch 'fetchJobs') {
  $content = $content.Replace(
    'useEffect(() => { fetchRFQs() }, [])',
    'const fetchJobs = async () => {
    setJobsLoading(true)
    try {
      const { data } = await supabase.from(''jobs'').select(''*'').order(''created_at'', { ascending: false })
      setJobs(data || [])
    } catch (e: any) { console.error(e) }
    finally { setJobsLoading(false) }
  }

  useEffect(() => { fetchRFQs(); fetchJobs() }, [])'
  )
  Write-Host "Added fetchJobs" -ForegroundColor Green
} else { Write-Host "fetchJobs already exists" -ForegroundColor Yellow }

# Step 5: Replace JobBoardPlaceholder render with JobBoard
$content = $content.Replace(
  ': <JobBoardPlaceholder />}',
  ': <JobBoard jobs={jobs} loading={jobsLoading} onCardClick={setSelectedJob} selectedId={selectedJob?.id} />}'
)

# Step 6: Add selectedJob panel render
if ($content -notmatch 'selectedJob &&') {
  $content = $content.Replace(
    '{showCreateModal && <CreateRFQModal',
    '{selectedJob && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <JobDetailPanel job={selectedJob} onClose={() => setSelectedJob(null)} onUpdate={(j) => { setJobs(prev => prev.map(x => x.id === j.id ? j : x)); setSelectedJob(j) }} />
        </div>
      )}
      {showCreateModal && <CreateRFQModal'
  )
  Write-Host "Added selectedJob panel" -ForegroundColor Green
}

# Step 7: Replace JobBoardPlaceholder function with full JobBoard
$oldPlaceholder = 'function JobBoardPlaceholder() {
  return <div className="flex items-center justify-center h-64"><p className="text-gray-400 text-lg font-medium">Job Board - coming soon</p></div>
}'

$newJobBoard = @'
function JobBoard({ jobs, loading, onCardClick, selectedId }: { jobs: Job[]; loading: boolean; onCardClick: (job: Job) => void; selectedId?: string }) {
  if (loading) return <div className="flex items-center justify-center h-64 gap-3 text-gray-400"><div className="w-5 h-5 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" /><span>Loading Jobs...</span></div>
  return (
    <div className="flex gap-4 h-full" style={{ minWidth: 'max-content' }}>
      {JOB_COLUMNS.map((col) => {
        const cards = jobs.filter(j => j.status === col.key)
        return (
          <div key={col.key} className="w-64 flex flex-col shrink-0">
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-t-lg ${col.color}`}>
              <span className="text-white text-sm font-bold">{col.label}</span>
              <span className="ml-auto bg-white bg-opacity-25 text-white text-xs font-bold px-2 py-0.5 rounded-full">{cards.length}</span>
            </div>
            <div className="flex-1 bg-gray-200 rounded-b-lg p-2 min-h-96 space-y-2">
              {cards.length === 0 && <div className="flex items-center justify-center h-20"><p className="text-gray-400 text-xs">No jobs</p></div>}
              {cards.map(job => <JobCard key={job.id} job={job} hoverColor={col.hover} onClick={() => onCardClick(job)} isSelected={job.id === selectedId} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function JobCard({ job, hoverColor, onClick, isSelected }: { job: Job; hoverColor: string; onClick: () => void; isSelected: boolean }) {
  const priority = job.priority?.toUpperCase() || 'NORMAL'
  return (
    <div onClick={onClick} className={`bg-white rounded-lg shadow-sm border-2 p-3 cursor-pointer hover:shadow-md ${hoverColor} transition-all ${isSelected ? 'border-green-400 shadow-md' : 'border-transparent'}`}>
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span className="text-xs font-bold text-green-600 tracking-wide">{job.job_number || 'Pending'}</span>
        {job.is_emergency && <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">EMERGENCY</span>}
        <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[priority] || PRIORITY_BADGE['NORMAL']}`}>{priority}</span>
      </div>
      <p className="text-sm font-medium text-gray-800 leading-snug mb-2 line-clamp-2">{job.description || 'No description'}</p>
      {job.client_name && <div className="flex items-center gap-1.5 mb-1"><span className="text-xs text-gray-500 truncate">{job.client_name}</span></div>}
      {job.due_date && <div className="flex items-center gap-1.5"><span className="text-xs text-gray-400">Due {job.due_date}</span></div>}
      {job.assigned_to && <div className="mt-2"><span className="text-xs text-gray-500">{job.assigned_to}</span></div>}
    </div>
  )
}

function JobDetailPanel({ job, onClose, onUpdate }: { job: Job; onClose: () => void; onUpdate: (job: Job) => void }) {
  const [saving, setSaving] = useState(false)
  const [editStatus, setEditStatus] = useState(job.status)
  const [editAssignedTo, setEditAssignedTo] = useState(job.assigned_to || '')
  const [editSupervisor, setEditSupervisor] = useState(job.supervisor || '')
  const [editDueDate, setEditDueDate] = useState(job.due_date || '')
  const [editNotes, setEditNotes] = useState(job.notes || '')

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data, error } = await supabase.from('jobs').update({
        status: editStatus,
        assigned_to: editAssignedTo || null,
        supervisor: editSupervisor || null,
        due_date: editDueDate || null,
        notes: editNotes || null,
      }).eq('id', job.id).select('*').single()
      if (error) throw error
      onUpdate(data)
    } catch (e: any) { alert('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
      <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between shrink-0">
        <div>
          <span className="text-base font-bold text-gray-900">{job.job_number || 'Pending Job'}</span>
          {job.is_emergency && <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">EMERGENCY</span>}
          <p className="text-sm text-gray-500 mt-0.5">{job.client_name}</p>
          {job.enq_number && <p className="text-xs text-gray-400">From: {job.enq_number}</p>}
        </div>
        <button onClick={onClose} className="ml-3 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Status</p>
          <div className="flex flex-wrap gap-2">
            {JOB_COLUMNS.map(col => (
              <button key={col.key} onClick={() => setEditStatus(col.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${editStatus === col.key ? col.color + ' text-white border-transparent' : 'border-gray-200 text-gray-600'}`}>
                {col.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800">{job.description}</p>
          {job.po_number && <p className="text-xs text-gray-500 mt-1">PO: {job.po_number}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Assigned To</label>
            <select value={editAssignedTo} onChange={e => setEditAssignedTo(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none bg-white">
              <option value="">Select...</option>
              {['Dewald','Jaco','Hendrik','Juanic','Workshop Team'].map(w => <option key={w}>{w}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Supervisor</label>
            <select value={editSupervisor} onChange={e => setEditSupervisor(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none bg-white">
              <option value="">Select...</option>
              {['Hendrik','Juanic','Wessie'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Due Date</label>
            <input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Notes</label>
          <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={2} className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none resize-none" />
        </div>
        <button onClick={handleSave} disabled={saving} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
'@

$content = $content.Replace($oldPlaceholder, $newJobBoard)

# Save
Copy-Item $f "$f.bak" -Force
[System.IO.File]::WriteAllLines($f, ($content -split "`n"), [System.Text.Encoding]::ASCII)

Write-Host "Done! Lines: $(($content -split "`n").Count)" -ForegroundColor Green
Write-Host "Verify:" -ForegroundColor Cyan
$verify = [System.IO.File]::ReadAllText($f)
if ($verify -match 'function JobBoard\(') { Write-Host "  OK: JobBoard component" -ForegroundColor Green }
else { Write-Host "  MISSING: JobBoard component" -ForegroundColor Red }
if ($verify -match 'const JOB_COLUMNS') { Write-Host "  OK: JOB_COLUMNS" -ForegroundColor Green }
else { Write-Host "  MISSING: JOB_COLUMNS" -ForegroundColor Red }
