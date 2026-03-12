"""
ERHA - Fix search bars in App.tsx
Run from: C:\Users\lenkl\WebstormProjects\erhakanbanclean0.1
Command:   python fix_search.py
"""

import sys

FILE = 'src/App.tsx'

with open(FILE, 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

print(f"Read {len(lines)} lines from {FILE}")

# Find RFQBoard start and end
rfq_start = None
rfq_end = None
job_start = None
job_end = None

for i, line in enumerate(lines):
    if line.startswith('function RFQBoard('):
        rfq_start = i
    if line.startswith('// RFQ CARD'):
        rfq_end = i  # exclusive - everything up to (not including) this line
    if line.startswith('// JOB BOARD'):
        job_start = i
    if line.startswith('// JOB CARD') or (job_start and i > job_start + 5 and line.startswith('function ') and 'JobBoard' not in line):
        if job_start and job_end is None:
            job_end = i

# Fallback: find job_end by looking for next top-level function after JobBoard
if job_start and not job_end:
    for i in range(job_start + 10, len(lines)):
        if lines[i].startswith('function ') or lines[i].startswith('// '):
            job_end = i
            break

print(f"RFQBoard: lines {rfq_start+1} to {rfq_end} (exclusive)")
print(f"JobBoard section: lines {job_start+1} to {job_end}")

if not rfq_start or not rfq_end:
    print("ERROR: Could not find RFQBoard boundaries")
    input("Press Enter to close")
    sys.exit(1)

# ── NEW RFQBOARD ────────────────────────────────────────────────────────────
NEW_RFQ = '''\
function RFQBoard({ rfqs, loading, error, onRefresh, onCardClick, selectedId }: { rfqs: RFQ[]; loading: boolean; error: string | null; onRefresh: () => void; onCardClick: (rfq: RFQ) => void; selectedId?: string }) {
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
          const cards = woFiltered.filter(r => r.status === col.key)
          return (
            <div key={col.key} className="w-64 flex flex-col shrink-0">
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-t-lg ${col.color}`}>
                <span className="text-white text-sm font-bold">{col.label}</span>
                <span className="ml-auto bg-white bg-opacity-25 text-white text-xs font-bold px-2 py-0.5 rounded-full">{cards.length}</span>
              </div>
              <div className="flex-1 bg-gray-200 rounded-b-lg p-2 min-h-96 space-y-2">
                {cards.length === 0 && <div className="flex items-center justify-center h-20"><p className="text-gray-400 text-xs">{woQ ? 'No matches' : 'No RFQs'}</p></div>}
                {cards.map(rfq => <RFQCard key={rfq.id} rfq={rfq} hoverColor={col.hover} onClick={() => onCardClick(rfq)} isSelected={rfq.id === selectedId} />)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

'''

# ── NEW JOBBOARD SECTION ────────────────────────────────────────────────────
NEW_JOB = '''\
// JOB BOARD

function JobBoard({ jobs, loading, onCardClick, selectedId }: { jobs: Job[]; loading: boolean; onCardClick: (job: Job) => void; selectedId?: string }) {
  const [jobSearch, setJobSearch] = React.useState('')
  const columns = [
    { key: 'PENDING',       label: 'Pending',       color: 'bg-gray-500'   },
    { key: 'SCHEDULED',     label: 'Scheduled',     color: 'bg-blue-500'   },
    { key: 'IN_PROGRESS',   label: 'In Progress',   color: 'bg-orange-500' },
    { key: 'ON_HOLD',       label: 'On Hold',       color: 'bg-red-400'    },
    { key: 'QUALITY_CHECK', label: 'Quality Check', color: 'bg-purple-500' },
    { key: 'COMPLETE',      label: 'Complete',      color: 'bg-green-500'  },
  ]
  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-gray-400">
      <div className="w-5 h-5 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" />
      <span>Loading jobs...</span>
    </div>
  )
  const jobQ = jobSearch.toLowerCase().trim()
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
          const cards = jobFiltered.filter(j => j.status === col.key)
          return (
            <div key={col.key} className="w-64 flex flex-col shrink-0">
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-t-lg ${col.color}`}>
                <span className="text-white text-sm font-bold">{col.label}</span>
                <span className="ml-auto bg-white bg-opacity-25 text-white text-xs font-bold px-2 py-0.5 rounded-full">{cards.length}</span>
              </div>
              <div className="flex-1 bg-gray-200 rounded-b-lg p-2 min-h-96 space-y-2">
                {cards.length === 0 && (
                  <div className="flex items-center justify-center h-20">
                    <p className="text-gray-400 text-xs">{jobQ ? 'No matches' : 'No jobs'}</p>
                  </div>
                )}
                {cards.map(job => (
                  <div key={job.id} onClick={() => onCardClick(job)}
                    className={`bg-white rounded-lg shadow-sm border-2 p-3 cursor-pointer hover:shadow-md transition-all ${job.id === selectedId ? 'border-green-400 shadow-md' : 'border-transparent hover:border-green-300'}`}>
                    <p className="text-xs font-bold text-green-600">{job.job_number || 'Pending'}</p>
                    <p className="text-sm font-medium text-gray-800 mt-1 line-clamp-2">{job.description || 'No description'}</p>
                    <p className="text-xs text-gray-500 mt-1 truncate">{job.client_name || '-'}</p>
                    {job.due_date && (
                      <p className="text-xs text-gray-400 mt-1">Due: {new Date(job.due_date).toLocaleDateString('en-ZA')}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

'''

# Build new file: keep everything before RFQBoard + new RFQBoard + keep from // RFQ CARD to // JOB BOARD + new JobBoard + keep rest
before_rfq = lines[:rfq_start]
rfq_card_to_job = lines[rfq_end:job_start]
after_job = lines[job_end:]

new_lines = (
    before_rfq +
    [NEW_RFQ] +
    rfq_card_to_job +
    [NEW_JOB] +
    after_job
)

with open(FILE, 'w', encoding='utf-8', newline='\n') as f:
    f.writelines(new_lines)

total = sum(1 for l in new_lines for _ in [1])
print(f"\nDONE - wrote {total} lines")
print("\nVerify:")
with open(FILE, 'r', encoding='utf-8') as f:
    verify = f.readlines()
for i, line in enumerate(verify):
    if 'flex flex-col h-full' in line:
        print(f"  Line {i+1}: {line.rstrip()}")
    if 'woSearch' in line and 'useState' in line:
        print(f"  Line {i+1}: {line.rstrip()}")
    if 'jobSearch' in line and 'useState' in line:
        print(f"  Line {i+1}: {line.rstrip()}")

input("\nPress Enter to close")
