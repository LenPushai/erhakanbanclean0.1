# ERHA Search Bar Fix - Surgical Replacement
# Run from project root: powershell -ExecutionPolicy Bypass -File fix_search_final.ps1

Set-Location $PSScriptRoot

Write-Host "Step 1: Reset to clean commit..."
git checkout f029372 -- src/App.tsx
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: git checkout failed"; Read-Host; exit }

$file = "src\App.tsx"
$lines = [System.IO.File]::ReadAllLines((Resolve-Path $file))
Write-Host "Read $($lines.Count) lines from clean commit"

$rfqBoardStart = -1
$rfqCardLine   = -1
$jobBoardLine  = -1
$createRFQLine = -1

for ($i = 0; $i -lt $lines.Count; $i++) {
  if ($lines[$i] -match '^function RFQBoard\(')  { $rfqBoardStart = $i }
  if ($lines[$i] -eq '// RFQ CARD')              { $rfqCardLine   = $i }
  if ($lines[$i] -eq '// JOB BOARD')             { $jobBoardLine  = $i }
  if ($lines[$i] -eq '// CREATE RFQ MODAL')      { $createRFQLine = $i }
}

Write-Host "RFQBoard start  : line $($rfqBoardStart + 1)"
Write-Host "// RFQ CARD     : line $($rfqCardLine   + 1)"
Write-Host "// JOB BOARD    : line $($jobBoardLine  + 1)"
Write-Host "// CREATE RFQ   : line $($createRFQLine + 1)"

if ($rfqBoardStart -lt 0 -or $rfqCardLine -lt 0 -or $jobBoardLine -lt 0 -or $createRFQLine -lt 0) {
  Write-Host "ERROR: landmarks not found"; Read-Host; exit
}

# NEW RFQBOARD
$newRFQBoard = @'
// RFQ BOARD

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
'@

# NEW JOBBOARD
$newJobBoard = @'
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
'@

# ASSEMBLE: before RFQ BOARD comment + newRFQBoard + RFQCard section + newJobBoard + rest
$before  = if ($rfqBoardStart -ge 2) { $lines[0..($rfqBoardStart - 3)] } else { @() }
$rfqCard = $lines[$rfqCardLine..($jobBoardLine - 1)]
$rest    = $lines[$createRFQLine..($lines.Count - 1)]

$out = [System.Collections.Generic.List[string]]::new()
foreach ($l in $before)    { $out.Add($l) }
foreach ($l in $newRFQBoard.Split("`n")) { $out.Add($l.TrimEnd("`r")) }
$out.Add('')
foreach ($l in $rfqCard)   { $out.Add($l) }
$out.Add('')
foreach ($l in $newJobBoard.Split("`n")) { $out.Add($l.TrimEnd("`r")) }
$out.Add('')
foreach ($l in $rest)      { $out.Add($l) }

[System.IO.File]::WriteAllLines(
  (Resolve-Path $file).Path,
  $out,
  [System.Text.Encoding]::ASCII
)

Write-Host ""
Write-Host "Done. Lines written: $($out.Count)"
Write-Host ""
Write-Host "Verification:"
$v = [System.IO.File]::ReadAllLines((Resolve-Path $file))
for ($i = 0; $i -lt $v.Count; $i++) {
  if ($v[$i] -match 'flex flex-col h-full') {
    Write-Host "  [line $($i+1)] $($v[$i].Trim())"
  }
}
Write-Host ""
Write-Host "All done! Now run: npx vite --force"
Read-Host "Press Enter to close"
