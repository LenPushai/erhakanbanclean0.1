# ERHA - Add search bars to Work Order Board and Job Board
# Run: powershell -ExecutionPolicy Bypass -File add_search.ps1

$file = "src\App.tsx"
$content = [System.IO.File]::ReadAllText($file)
$fixes = 0

Write-Host "Read $($content.Length) chars"
Write-Host ""

# ============================================================
# FIX 1 - RFQBoard: add state + filtered + search UI
# ============================================================
$old1 = 'function RFQBoard({ rfqs, loading, error, onRefresh, onCardClick, selectedId }: { rfqs: RFQ[]; loading: boolean; error: string | null; onRefresh: () => void; onCardClick: (rfq: RFQ) => void; selectedId?: string }) {
  if (loading) return <div className="flex items-center justify-center h-64 gap-3 text-gray-400"><div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" /><span>Loading RFQs...</span></div>
  if (error) return <div className="flex items-center justify-center h-64"><div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center"><p className="text-red-700 font-semibold mb-2">Failed to load</p><p className="text-red-500 text-sm mb-4">{error}</p><button onClick={onRefresh} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Try Again</button></div></div>
  return (
    <div className="flex gap-4 h-full" style={{ minWidth: ''max-content'' }}>
      {RFQ_COLUMNS.map((col) => {
        const cards = rfqs.filter(r => r.status === col.key)'

$new1 = 'function RFQBoard({ rfqs, loading, error, onRefresh, onCardClick, selectedId }: { rfqs: RFQ[]; loading: boolean; error: string | null; onRefresh: () => void; onCardClick: (rfq: RFQ) => void; selectedId?: string }) {
  const [woSearch, setWoSearch] = React.useState('''')
  if (loading) return <div className="flex items-center justify-center h-64 gap-3 text-gray-400"><div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" /><span>Loading RFQs...</span></div>
  if (error) return <div className="flex items-center justify-center h-64"><div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center"><p className="text-red-700 font-semibold mb-2">Failed to load</p><p className="text-red-500 text-sm mb-4">{error}</p><button onClick={onRefresh} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Try Again</button></div></div>
  const woQ = woSearch.toLowerCase().trim()
  const woFiltered = woQ ? rfqs.filter(r =>
    (r.enq_number || '''').toLowerCase().includes(woQ) ||
    (r.clients?.company_name || '''').toLowerCase().includes(woQ) ||
    (r.description || '''').toLowerCase().includes(woQ) ||
    (r.assigned_quoter_name || '''').toLowerCase().includes(woQ)
  ) : rfqs
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 pb-3 shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input value={woSearch} onChange={e => setWoSearch(e.target.value)} placeholder="Search WO number, client, description..." className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white w-80" />
        </div>
        {woQ && <span className="text-xs text-gray-500">{woFiltered.length} result{woFiltered.length !== 1 ? ''s'' : ''''}</span>}
        {woQ && <button onClick={() => setWoSearch('''')} className="text-xs text-blue-500 hover:underline">Clear</button>}
      </div>
      <div className="flex gap-4 overflow-x-auto flex-1" style={{ minWidth: ''max-content'' }}>
      {RFQ_COLUMNS.map((col) => {
        const cards = woFiltered.filter(r => r.status === col.key)'

if ($content.Contains($old1)) {
  $content = $content.Replace($old1, $new1)
  Write-Host "FIX 1 OK - RFQBoard search bar added"
  $fixes++
} else { Write-Host "FIX 1 SKIP - pattern not found" }

# ============================================================
# FIX 2 - RFQBoard: close the new wrapper divs + update empty state
# ============================================================
$old2 = '              {cards.length === 0 && <div className="flex items-center justify-center h-20"><p className="text-gray-400 text-xs">No RFQs</p></div>}
              {cards.map(rfq => <RFQCard key={rfq.id} rfq={rfq} hoverColor={col.hover} onClick={() => onCardClick(rfq)} isSelected={rfq.id === selectedId} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
function JobBoard('

$new2 = '              {cards.length === 0 && <div className="flex items-center justify-center h-20"><p className="text-gray-400 text-xs">{woQ ? ''No matches'' : ''No RFQs''}</p></div>}
              {cards.map(rfq => <RFQCard key={rfq.id} rfq={rfq} hoverColor={col.hover} onClick={() => onCardClick(rfq)} isSelected={rfq.id === selectedId} />)}
            </div>
          </div>
        )
      })}
      </div>
    </div>
  )
}
function JobBoard('

if ($content.Contains($old2)) {
  $content = $content.Replace($old2, $new2)
  Write-Host "FIX 2 OK - RFQBoard closing divs fixed"
  $fixes++
} else { Write-Host "FIX 2 SKIP - pattern not found" }

# ============================================================
# FIX 3 - JobBoard: add state before loading return + filtered + search UI
# ============================================================
$old3 = '  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-gray-400">
      <div className="w-5 h-5 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" />
      <span>Loading jobs...</span>
    </div>
  )
  return (
    <div className="flex gap-4 h-full" style={{ minWidth: ''max-content'' }}>
      {columns.map(col => {
        const cards = jobs.filter(j => j.status === col.key)'

$new3 = '  const [jobSearch, setJobSearch] = React.useState('''')
  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-gray-400">
      <div className="w-5 h-5 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" />
      <span>Loading jobs...</span>
    </div>
  )
  const jobQ = jobSearch.toLowerCase().trim()
  const jobFiltered = jobQ ? jobs.filter(j =>
    (j.job_number || '''').toLowerCase().includes(jobQ) ||
    (j.client_name || '''').toLowerCase().includes(jobQ) ||
    (j.description || '''').toLowerCase().includes(jobQ) ||
    (j.po_number || '''').toLowerCase().includes(jobQ)
  ) : jobs
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 pb-3 shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input value={jobSearch} onChange={e => setJobSearch(e.target.value)} placeholder="Search job number, client, description..." className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white w-80" />
        </div>
        {jobQ && <span className="text-xs text-gray-500">{jobFiltered.length} result{jobFiltered.length !== 1 ? ''s'' : ''''}</span>}
        {jobQ && <button onClick={() => setJobSearch('''')} className="text-xs text-blue-500 hover:underline">Clear</button>}
      </div>
      <div className="flex gap-4 overflow-x-auto flex-1" style={{ minWidth: ''max-content'' }}>
      {columns.map(col => {
        const cards = jobFiltered.filter(j => j.status === col.key)'

if ($content.Contains($old3)) {
  $content = $content.Replace($old3, $new3)
  Write-Host "FIX 3 OK - JobBoard search bar added"
  $fixes++
} else { Write-Host "FIX 3 SKIP - pattern not found" }

# ============================================================
# FIX 4 - JobBoard: close the new wrapper divs + update empty state
# ============================================================
$old4 = '              {cards.length === 0 ? <div className="flex items-center justify-center h-20"><p className="text-gray-400 text-xs">No jobs</p></div> : cards.map(job => <JobCard key={job.id} job={job} onClick={() => setSelectedJob(job)} isSelected={selectedJob?.id === job.id} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
// RFQ CARD'

$new4 = '              {cards.length === 0 ? <div className="flex items-center justify-center h-20"><p className="text-gray-400 text-xs">{jobQ ? ''No matches'' : ''No jobs''}</p></div> : cards.map(job => <JobCard key={job.id} job={job} onClick={() => setSelectedJob(job)} isSelected={selectedJob?.id === job.id} />)}
            </div>
          </div>
        )
      })}
      </div>
    </div>
  )
}
// RFQ CARD'

if ($content.Contains($old4)) {
  $content = $content.Replace($old4, $new4)
  Write-Host "FIX 4 OK - JobBoard closing divs fixed"
  $fixes++
} else { Write-Host "FIX 4 SKIP - pattern not found" }

# ============================================================
# WRITE
# ============================================================
Write-Host ""
if ($fixes -gt 0) {
  [System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::ASCII)
  Write-Host "DONE - $fixes fix(es) saved"
  Write-Host "Lines: $($content.Split([char]10).Length)"
  Write-Host ""
  Write-Host "Verify: findstr /c:""Search WO number"" src\App.tsx"
} else {
  Write-Host "NO CHANGES MADE"
}
