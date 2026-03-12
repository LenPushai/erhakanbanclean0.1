const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, 'src', 'App.tsx')
let c = fs.readFileSync(file, 'utf8')

console.log('Read', c.split('\n').length, 'lines')

// 1. Add Search to lucide import
c = c.replace(
  "import { ClipboardList, Briefcase, ChevronRight, Factory, Building2, Calendar, Hash, RefreshCw, ArrowDownToLine, ArrowUpFromLine, X, Mail, FileText, Paperclip, Send, Plus } from 'lucide-react'",
  "import { ClipboardList, Briefcase, ChevronRight, Factory, Building2, Calendar, Hash, RefreshCw, ArrowDownToLine, ArrowUpFromLine, X, Mail, FileText, Paperclip, Send, Plus, Search } from 'lucide-react'"
)

// 2. Replace RFQBoard
const oldRFQ = `function RFQBoard({ rfqs, loading, error, onRefresh, onCardClick, selectedId }: { rfqs: RFQ[]; loading: boolean; error: string | null; onRefresh: () => void; onCardClick: (rfq: RFQ) => void; selectedId?: string }) {
  if (loading) return <div className="flex items-center justify-center h-64 gap-3 text-gray-400"><div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" /><span>Loading RFQs...</span></div>
  if (error) return <div className="flex items-center justify-center h-64"><div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center"><p className="text-red-700 font-semibold mb-2">Failed to load</p><p className="text-red-500 text-sm mb-4">{error}</p><button onClick={onRefresh} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Try Again</button></div></div>
  return (
    <div className="flex gap-4 h-full" style={{ minWidth: 'max-content' }}>
      {RFQ_COLUMNS.map((col) => {
        const cards = rfqs.filter(r => r.status === col.key)`

const newRFQ = `function RFQBoard({ rfqs, loading, error, onRefresh, onCardClick, selectedId }: { rfqs: RFQ[]; loading: boolean; error: string | null; onRefresh: () => void; onCardClick: (rfq: RFQ) => void; selectedId?: string }) {
  const [woSearch, setWoSearch] = React.useState('')
  if (loading) return <div className="flex items-center justify-center h-64 gap-3 text-gray-400"><div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" /><span>Loading RFQs...</span></div>
  if (error) return <div className="flex items-center justify-center h-64"><div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center"><p className="text-red-700 font-semibold mb-2">Failed to load</p><p className="text-red-500 text-sm mb-4">{error}</p><button onClick={onRefresh} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Try Again</button></div></div>
  const woQ = woSearch.toLowerCase().trim()
  const woFiltered = woQ ? rfqs.filter(r =>
    (r.enq_number || '').toLowerCase().includes(woQ) ||
    (r.clients?.company_name || '').toLowerCase().includes(woQ) ||
    (r.description || '').toLowerCase().includes(woQ) ||
    (r.assigned_quoter_name || '').toLowerCase().includes(woQ)
  ) : rfqs
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 pb-3 shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input value={woSearch} onChange={e => setWoSearch(e.target.value)} placeholder="Search WO number, client, description..." className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white w-80" />
        </div>
        {woQ && <span className="text-xs text-gray-500">{woFiltered.length} result{woFiltered.length !== 1 ? 's' : ''}</span>}
        {woQ && <button onClick={() => setWoSearch('')} className="text-xs text-blue-500 hover:underline">Clear</button>}
      </div>
      <div className="flex gap-4 overflow-x-auto flex-1" style={{ minWidth: 'max-content' }}>
        {RFQ_COLUMNS.map((col) => {
          const cards = woFiltered.filter(r => r.status === col.key)`

if (c.includes(oldRFQ)) {
  c = c.replace(oldRFQ, newRFQ)
  console.log('RFQBoard: PATCHED')
} else {
  console.log('RFQBoard: NOT FOUND - check file state')
  process.exit(1)
}

// 3. Replace JobBoard return wrapper + filter
const oldJob = `  return (
    <div className="flex gap-4 h-full" style={{ minWidth: 'max-content' }}>
      {columns.map(col => {
        const cards = jobs.filter(j => j.status === col.key)`

const newJob = `  const jobQ = jobSearch.toLowerCase().trim()
  const jobFiltered = jobQ ? jobs.filter(j =>
    (j.job_number || '').toLowerCase().includes(jobQ) ||
    (j.client_name || '').toLowerCase().includes(jobQ) ||
    (j.description || '').toLowerCase().includes(jobQ) ||
    (j.po_number || '').toLowerCase().includes(jobQ)
  ) : jobs
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 pb-3 shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input value={jobSearch} onChange={e => setJobSearch(e.target.value)} placeholder="Search job number, client, description..." className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white w-80" />
        </div>
        {jobQ && <span className="text-xs text-gray-500">{jobFiltered.length} result{jobFiltered.length !== 1 ? 's' : ''}</span>}
        {jobQ && <button onClick={() => setJobSearch('')} className="text-xs text-blue-500 hover:underline">Clear</button>}
      </div>
      <div className="flex gap-4 overflow-x-auto flex-1" style={{ minWidth: 'max-content' }}>
        {columns.map(col => {
          const cards = jobFiltered.filter(j => j.status === col.key)`

if (c.includes(oldJob)) {
  c = c.replace(oldJob, newJob)
  console.log('JobBoard return: PATCHED')
} else {
  console.log('JobBoard return: NOT FOUND - check file state')
  process.exit(1)
}

// 4. Add jobSearch state to JobBoard
const oldJobState = `function JobBoard({ jobs, loading, onCardClick, selectedId }: { jobs: Job[]; loading: boolean; onCardClick: (job: Job) => void; selectedId?: string }) {
  const columns = [`

const newJobState = `function JobBoard({ jobs, loading, onCardClick, selectedId }: { jobs: Job[]; loading: boolean; onCardClick: (job: Job) => void; selectedId?: string }) {
  const [jobSearch, setJobSearch] = React.useState('')
  const columns = [`

if (c.includes(oldJobState)) {
  c = c.replace(oldJobState, newJobState)
  console.log('JobBoard state: PATCHED')
} else {
  console.log('JobBoard state: NOT FOUND - check file state')
  process.exit(1)
}

// 5. Fix JobBoard closing - add extra </div> before final </div> of return
// Find the pattern: })} \n    </div>\n  )\n}\n\n// CREATE RFQ
const oldClose = `        })}
      </div>
    </div>
  )
}

// CREATE RFQ MODAL`

const newClose = `        })}
      </div>
    </div>
  )
}

// CREATE RFQ MODAL`

// JobBoard already has correct closing from the columns wrapper - just verify
const jobBoardIdx = c.indexOf('// JOB BOARD')
const createRFQIdx = c.indexOf('// CREATE RFQ MODAL')
const jobSection = c.slice(jobBoardIdx, createRFQIdx)
const closingDivCount = (jobSection.match(/<\/div>/g) || []).length
console.log('JobBoard closing </div> count:', closingDivCount, '(need 5 minimum)')

fs.writeFileSync(file, c, 'utf8')
console.log('')
console.log('Written', c.split('\n').length, 'lines')
console.log('')
console.log('Verify:')
const v = fs.readFileSync(file, 'utf8').split('\n')
v.forEach((l, i) => {
  if (l.includes('flex flex-col h-full')) console.log('  line', i+1, ':', l.trim())
  if (l.includes("useState('')") && l.includes('Search')) console.log('  line', i+1, ':', l.trim())
})
console.log('')
console.log('Done! Now run: npx vite --force')
