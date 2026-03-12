# ERHA - Add search bar to Work Order Board and Job Board
# Run: powershell -ExecutionPolicy Bypass -File fix_search_bar.ps1

$file = "src\App.tsx"
$content = [System.IO.File]::ReadAllText($file)
$fixes = 0

Write-Host "Read $($content.Length) chars"
Write-Host ""

# ============================================================
# FIX 1 - Add search state and filtered cards to RFQBoard
# ============================================================
$old1 = 'function RFQBoard({ rfqs, loading, error, onRefresh, onCardClick, selectedId }: { rfqs: RFQ[]; loading: boolean; error: string | null; onRefresh: () => void; onCardClick: (rfq: RFQ) => void; selectedId?: string }) {
  if (loading) return <div className="flex items-center justify-center h-64 gap-3 text-gray-400"><div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" /><span>Loading RFQs...</span></div>
  if (error) return <div className="flex items-center justify-center h-64"><div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center"><p className="text-red-700 font-semibold mb-2">Failed to load</p><p className="text-red-500 text-sm mb-4">{error}</p><button onClick={onRefresh} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Try Again</button></div></div>
  return (
    <div className="flex gap-4 h-full" style={{ minWidth: ''max-content'' }}>
      {RFQ_COLUMNS.map((col) => {
        const cards = rfqs.filter(r => r.status === col.key)'

$new1 = 'function RFQBoard({ rfqs, loading, error, onRefresh, onCardClick, selectedId }: { rfqs: RFQ[]; loading: boolean; error: string | null; onRefresh: () => void; onCardClick: (rfq: RFQ) => void; selectedId?: string }) {
  const [search, setSearch] = React.useState('''')
  if (loading) return <div className="flex items-center justify-center h-64 gap-3 text-gray-400"><div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" /><span>Loading RFQs...</span></div>
  if (error) return <div className="flex items-center justify-center h-64"><div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center"><p className="text-red-700 font-semibold mb-2">Failed to load</p><p className="text-red-500 text-sm mb-4">{error}</p><button onClick={onRefresh} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Try Again</button></div></div>
  const q = search.toLowerCase().trim()
  const filtered = q ? rfqs.filter(r =>
    (r.enq_number || '''').toLowerCase().includes(q) ||
    (r.clients?.company_name || '''').toLowerCase().includes(q) ||
    (r.description || '''').toLowerCase().includes(q) ||
    (r.assigned_quoter_name || '''').toLowerCase().includes(q)
  ) : rfqs
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-1 pb-3 shrink-0">
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search work orders..." className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white" />
        </div>
        {q && <span className="text-xs text-gray-500">{filtered.length} result{filtered.length !== 1 ? ''s'' : ''''}</span>}
        {q && <button onClick={() => setSearch('''')} className="text-xs text-blue-500 hover:underline">Clear</button>}
      </div>
      <div className="flex gap-4 flex-1 overflow-x-auto" style={{ minWidth: ''max-content'' }}>
      {RFQ_COLUMNS.map((col) => {
        const cards = filtered.filter(r => r.status === col.key)'

if ($content.Contains($old1)) {
  $content = $content.Replace($old1, $new1)
  Write-Host "FIX 1 OK - search bar added to Work Order Board"
  $fixes++
} else { Write-Host "FIX 1 SKIP - pattern not found" }

# ============================================================
# FIX 2 - Close the extra wrapper div in RFQBoard return
# ============================================================
$old2 = '      {RFQ_COLUMNS.map((col) => {
        const cards = rfqs.filter(r => r.status === col.key)
        return (
          <div key={col.key} className="w-64 flex flex-col shrink-0">
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-t-lg ${col.color}`}>
              <span className="text-white text-sm font-bold">{col.label}</span>
              <span className="ml-auto bg-white bg-opacity-25 text-white text-xs font-bold px-2 py-0.5 rounded-full">{cards.length}</span>
            </div>
            <div className="flex-1 bg-gray-200 rounded-b-lg p-2 min-h-96 space-y-2">
              {cards.length === 0 && <div className="flex items-center justify-center h-20"><p className="text-gray-400 text-xs">No RFQs</p></div>}
              {cards.map(rfq => <RFQCard key={rfq.id} rfq={rfq} hoverColor={col.hover} onClick={() => onCardClick(rfq)} isSelected={rfq.id === selectedId} />)}
            </div>
          </div>
        )
      })}
    </div>
  )'

$new2 = '      {RFQ_COLUMNS.map((col) => {
        const cards = filtered.filter(r => r.status === col.key)
        return (
          <div key={col.key} className="w-64 flex flex-col shrink-0">
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-t-lg ${col.color}`}>
              <span className="text-white text-sm font-bold">{col.label}</span>
              <span className="ml-auto bg-white bg-opacity-25 text-white text-xs font-bold px-2 py-0.5 rounded-full">{cards.length}</span>
            </div>
            <div className="flex-1 bg-gray-200 rounded-b-lg p-2 min-h-96 space-y-2">
              {cards.length === 0 && <div className="flex items-center justify-center h-20"><p className="text-gray-400 text-xs">{q ? ''No matches'' : ''No RFQs''}</p></div>}
              {cards.map(rfq => <RFQCard key={rfq.id} rfq={rfq} hoverColor={col.hover} onClick={() => onCardClick(rfq)} isSelected={rfq.id === selectedId} />)}
            </div>
          </div>
        )
      })}
      </div>
    </div>
  )'

if ($content.Contains($old2)) {
  $content = $content.Replace($old2, $new2)
  Write-Host "FIX 2 OK - RFQBoard closing divs updated"
  $fixes++
} else { Write-Host "FIX 2 SKIP - pattern not found" }

# ============================================================
# FIX 3 - Add search to Job Board
# ============================================================
$old3 = '  const columns = ['

# Find the JobBoard function and add search there
# We need to find the right spot - look for the JobBoard return
$old3 = '  return (
    <div className="flex gap-4 h-full" style={{ minWidth: ''max-content'' }}>
      {columns.map(col => {
        const cards = jobs.filter(j => j.status === col.key)'

$new3 = '  const [jobSearch, setJobSearch] = React.useState('''')
  const jq = jobSearch.toLowerCase().trim()
  const filteredJobs = jq ? jobs.filter(j =>
    (j.job_number || '''').toLowerCase().includes(jq) ||
    (j.client_name || '''').toLowerCase().includes(jq) ||
    (j.description || '''').toLowerCase().includes(jq) ||
    (j.po_number || '''').toLowerCase().includes(jq)
  ) : jobs
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-1 pb-3 shrink-0">
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={jobSearch} onChange={e => setJobSearch(e.target.value)} placeholder="Search jobs..." className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white" />
        </div>
        {jq && <span className="text-xs text-gray-500">{filteredJobs.length} result{filteredJobs.length !== 1 ? ''s'' : ''''}</span>}
        {jq && <button onClick={() => setJobSearch('''')} className="text-xs text-blue-500 hover:underline">Clear</button>}
      </div>
      <div className="flex gap-4 flex-1 overflow-x-auto" style={{ minWidth: ''max-content'' }}>
      {columns.map(col => {
        const cards = filteredJobs.filter(j => j.status === col.key)'

if ($content.Contains($old3)) {
  $content = $content.Replace($old3, $new3)
  Write-Host "FIX 3 OK - search bar added to Job Board"
  $fixes++
} else { Write-Host "FIX 3 SKIP - pattern not found" }

# ============================================================
# FIX 4 - Close the extra wrapper div in JobBoard return
# ============================================================
$old4 = '      {columns.map(col => {
        const cards = jobs.filter(j => j.status === col.key)
        return (
          <div key={col.key} className="w-64 flex flex-col shrink-0">
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-t-lg ${col.color}`}>
              <span className="text-white text-sm font-bold">{col.label}</span>
              <span className="ml-auto bg-white bg-opacity-25 text-white text-xs font-bold px-2 py-0.5 rounded-full">{cards.length}</span>
            </div>
            <div className="flex-1 bg-gray-200 rounded-b-lg p-2 min-h-96 space-y-2 overflow-y-auto">
              {cards.length === 0 ? <div className="flex items-center justify-center h-20"><p className="text-gray-400 text-xs">No jobs</p></div> : cards.map(job => <JobCard key={job.id} job={job} onClick={() => setSelectedJob(job)} isSelected={selectedJob?.id === job.id} />)}
            </div>
          </div>
        )
      })}
    </div>
  )'

$new4 = '      {columns.map(col => {
        const cards = filteredJobs.filter(j => j.status === col.key)
        return (
          <div key={col.key} className="w-64 flex flex-col shrink-0">
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-t-lg ${col.color}`}>
              <span className="text-white text-sm font-bold">{col.label}</span>
              <span className="ml-auto bg-white bg-opacity-25 text-white text-xs font-bold px-2 py-0.5 rounded-full">{cards.length}</span>
            </div>
            <div className="flex-1 bg-gray-200 rounded-b-lg p-2 min-h-96 space-y-2 overflow-y-auto">
              {cards.length === 0 ? <div className="flex items-center justify-center h-20"><p className="text-gray-400 text-xs">{jq ? ''No matches'' : ''No jobs''}</p></div> : cards.map(job => <JobCard key={job.id} job={job} onClick={() => setSelectedJob(job)} isSelected={selectedJob?.id === job.id} />)}
            </div>
          </div>
        )
      })}
      </div>
    </div>
  )'

if ($content.Contains($old4)) {
  $content = $content.Replace($old4, $new4)
  Write-Host "FIX 4 OK - Job Board closing divs updated"
  $fixes++
} else { Write-Host "FIX 4 SKIP - pattern not found" }

# ============================================================
# WRITE FILE
# ============================================================
Write-Host ""
if ($fixes -gt 0) {
  [System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::ASCII)
  Write-Host "DONE - $fixes fix(es) saved"
  Write-Host "Lines: $($content.Split([char]10).Length)"
  Write-Host ""
  Write-Host "Verify:"
  Write-Host "  findstr /c:""Search work orders"" src\App.tsx"
} else {
  Write-Host "NO CHANGES MADE"
}
