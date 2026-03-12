# ERHA - Fix boards to use filtered search results
# Run: powershell -ExecutionPolicy Bypass -File fix_search_wire.ps1

$file = "src\App.tsx"
$content = [System.IO.File]::ReadAllText($file)
$fixes = 0

Write-Host "Read $($content.Length) chars"
Write-Host ""

# FIX 1 - Wire RFQBoard return to use filtered + correct layout
$old1 = '  return (
    <div className="flex gap-4 h-full" style={{ minWidth: ''max-content'' }}>
      {RFQ_COLUMNS.map((col) => {
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
    </div>'

$new1 = '  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-1 pb-3 shrink-0">
        <div className="relative w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by WO number, client, description..." className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white shadow-sm" />
        </div>
        {q && <span className="text-xs text-gray-500">{filtered.length} result{filtered.length !== 1 ? ''s'' : ''''}</span>}
        {q && <button onClick={() => setSearch('''')} className="text-xs text-blue-500 hover:underline">Clear</button>}
      </div>
      <div className="flex gap-4 flex-1 overflow-x-auto pb-2" style={{ minWidth: ''max-content'' }}>
        {RFQ_COLUMNS.map((col) => {
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
    </div>'

if ($content.Contains($old1)) {
  $content = $content.Replace($old1, $new1)
  Write-Host "FIX 1 OK - RFQBoard wired to filtered results"
  $fixes++
} else { Write-Host "FIX 1 SKIP - pattern not found" }

# FIX 2 - Wire JobBoard return to use filteredJobs + correct layout
$old2 = '    <div className="flex gap-4 h-full" style={{ minWidth: ''max-content'' }}>
      {columns.map(col => {
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
    </div>'

$new2 = '    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-1 pb-3 shrink-0">
        <div className="relative w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={jobSearch} onChange={e => setJobSearch(e.target.value)} placeholder="Search by job number, client, description..." className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white shadow-sm" />
        </div>
        {jq && <span className="text-xs text-gray-500">{filteredJobs.length} result{filteredJobs.length !== 1 ? ''s'' : ''''}</span>}
        {jq && <button onClick={() => setJobSearch('''')} className="text-xs text-blue-500 hover:underline">Clear</button>}
      </div>
      <div className="flex gap-4 flex-1 overflow-x-auto pb-2" style={{ minWidth: ''max-content'' }}>
        {columns.map(col => {
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
    </div>'

if ($content.Contains($old2)) {
  $content = $content.Replace($old2, $new2)
  Write-Host "FIX 2 OK - JobBoard wired to filteredJobs results"
  $fixes++
} else { Write-Host "FIX 2 SKIP - pattern not found" }

# Remove duplicate search bars from FIX 1 of previous script (they added search bars that wont render now)
$old3 = '      <div className="flex items-center gap-2 px-1 pb-3 shrink-0">
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search work orders..." className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white" />
        </div>
        {q && <span className="text-xs text-gray-500">{filtered.length} result{filtered.length !== 1 ? ''s'' : ''''}</span>}
        {q && <button onClick={() => setSearch('''')} className="text-xs text-blue-500 hover:underline">Clear</button>}
      </div>
      <div className="flex gap-4 flex-1 overflow-x-auto" style={{ minWidth: ''max-content'' }}>'
$new3 = ''

if ($content.Contains($old3)) {
  $content = $content.Replace($old3, $new3)
  Write-Host "FIX 3 OK - removed duplicate RFQ search bar"
  $fixes++
} else { Write-Host "FIX 3 SKIP" }

$old4 = '      <div className="flex items-center gap-2 px-1 pb-3 shrink-0">
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={jobSearch} onChange={e => setJobSearch(e.target.value)} placeholder="Search jobs..." className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white" />
        </div>
        {jq && <span className="text-xs text-gray-500">{filteredJobs.length} result{filteredJobs.length !== 1 ? ''s'' : ''''}</span>}
        {jq && <button onClick={() => setJobSearch('''')} className="text-xs text-blue-500 hover:underline">Clear</button>}
      </div>
      <div className="flex gap-4 flex-1 overflow-x-auto" style={{ minWidth: ''max-content'' }}>'
$new4 = ''

if ($content.Contains($old4)) {
  $content = $content.Replace($old4, $new4)
  Write-Host "FIX 4 OK - removed duplicate Job search bar"
  $fixes++
} else { Write-Host "FIX 4 SKIP" }

Write-Host ""
if ($fixes -gt 0) {
  [System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::ASCII)
  Write-Host "DONE - $fixes fix(es) saved"
  Write-Host "Lines: $($content.Split([char]10).Length)"
} else {
  Write-Host "NO CHANGES MADE"
}
