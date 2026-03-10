const fs = require('fs');
const path = 'src/App.tsx';
let c = fs.readFileSync(path, 'utf8');

// 1. Add missing state to App() - insert after showCreateModal state line
c = c.replace(
  `  const [showCreateModal, setShowCreateModal] = useState(false)`,
  `  const [showCreateModal, setShowCreateModal] = useState(false)
  const [jobs, setJobs] = useState<any[]>([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [selectedJob, setSelectedJob] = useState<any | null>(null)`
);

// 2. Add fetchJobs function - insert after fetchRFQs function
c = c.replace(
  `  useEffect(() => { fetchRFQs() }, [])`,
  `  const fetchJobs = async () => {
    setJobsLoading(true)
    try {
      const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setJobs(data || [])
    } catch (e: any) { console.error('Jobs error:', e.message) }
    finally { setJobsLoading(false) }
  }

  useEffect(() => { fetchRFQs(); fetchJobs() }, [])`
);

// 3. Replace JobBoardPlaceholder with real JobBoard
const placeholder = `function JobBoardPlaceholder() {
  return <div className="flex items-center justify-center h-64"><p className="text-gray-400 text-lg font-medium">Job Board - coming soon</p></div>
}`;

const jobBoard = `function JobBoard({ jobs, loading, onCardClick, selectedId }: { jobs: any[]; loading: boolean; onCardClick: (job: any) => void; selectedId?: string }) {
  const columns = [
    { key: 'PENDING',       label: 'Pending',       color: 'bg-gray-500'   },
    { key: 'SCHEDULED',     label: 'Scheduled',     color: 'bg-blue-500'   },
    { key: 'IN_PROGRESS',   label: 'In Progress',   color: 'bg-orange-500' },
    { key: 'ON_HOLD',       label: 'On Hold',       color: 'bg-red-400'    },
    { key: 'QUALITY_CHECK', label: 'Quality Check', color: 'bg-purple-500' },
    { key: 'COMPLETE',      label: 'Complete',      color: 'bg-green-500'  },
  ]
  if (loading) return <div className="flex items-center justify-center h-64 gap-3 text-gray-400"><div className="w-5 h-5 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" /><span>Loading jobs...</span></div>
  return (
    <div className="flex gap-4 h-full" style={{ minWidth: 'max-content' }}>
      {columns.map(col => {
        const cards = jobs.filter(j => j.status === col.key)
        return (
          <div key={col.key} className="w-64 flex flex-col shrink-0">
            <div className={\`flex items-center gap-2 px-3 py-2.5 rounded-t-lg \${col.color}\`}>
              <span className="text-white text-sm font-bold">{col.label}</span>
              <span className="ml-auto bg-white bg-opacity-25 text-white text-xs font-bold px-2 py-0.5 rounded-full">{cards.length}</span>
            </div>
            <div className="flex-1 bg-gray-200 rounded-b-lg p-2 min-h-96 space-y-2">
              {cards.length === 0 && <div className="flex items-center justify-center h-20"><p className="text-gray-400 text-xs">No jobs</p></div>}
              {cards.map(job => (
                <div key={job.id} onClick={() => onCardClick(job)}
                  className={\`bg-white rounded-lg shadow-sm border-2 p-3 cursor-pointer hover:shadow-md transition-all \${job.id === selectedId ? 'border-green-400 shadow-md' : 'border-transparent hover:border-green-300'}\`}>
                  <p className="text-xs font-bold text-green-600">{job.job_number || 'Pending'}</p>
                  <p className="text-sm font-medium text-gray-800 mt-1 line-clamp-2">{job.description || 'No description'}</p>
                  <p className="text-xs text-gray-500 mt-1 truncate">{job.client_name || '-'}</p>
                  {job.due_date && <p className="text-xs text-gray-400 mt-1">Due: {new Date(job.due_date).toLocaleDateString('en-ZA')}</p>}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}`;

if (c.includes(placeholder)) {
  c = c.replace(placeholder, jobBoard);
  console.log('✅ JobBoardPlaceholder replaced');
} else {
  console.log('❌ Placeholder not found - check manually');
  process.exit(1);
}

fs.writeFileSync(path, c, 'ascii');
console.log('✅ State variables added (jobs, jobsLoading, selectedJob)');
console.log('✅ fetchJobs() function added');
console.log('✅ File saved');
console.log('Lines:', c.split('\n').length);
