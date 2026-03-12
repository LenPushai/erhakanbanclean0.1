# ERHA - Fix search bars - inject input JSX into board returns
# Run: powershell -ExecutionPolicy Bypass -File fix_search_final.ps1

$file = "src\App.tsx"
$content = [System.IO.File]::ReadAllText($file)
$fixes = 0

Write-Host "Read $($content.Length) chars"
Write-Host ""

# FIX 1 - RFQBoard: inject search input into return
$old1 = '  return (
    <div className="flex flex-col h-full">

      {RFQ_COLUMNS.map((col) => {'

$new1 = '  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-1 pb-3 shrink-0">
        <div className="relative w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search WO number, client, description..." className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white shadow-sm" />
        </div>
        {q && <span className="text-xs text-gray-500">{filtered.length} result{filtered.length !== 1 ? ''s'' : ''''}</span>}
        {q && <button onClick={() => setSearch('''')} className="text-xs text-blue-500 hover:underline">Clear</button>}
      </div>
      <div className="flex gap-4 flex-1 overflow-x-auto pb-2">
      {RFQ_COLUMNS.map((col) => {'

if ($content.Contains($old1)) {
  $content = $content.Replace($old1, $new1)
  Write-Host "FIX 1 OK - RFQBoard search input injected"
  $fixes++
} else { Write-Host "FIX 1 SKIP" }

# FIX 2 - RFQBoard: close the extra div
$old2 = '      })}
    </div>
  )
}
function JobBoard('

$new2 = '      })}
      </div>
    </div>
  )
}
function JobBoard('

if ($content.Contains($old2)) {
  $content = $content.Replace($old2, $new2)
  Write-Host "FIX 2 OK - RFQBoard closing div added"
  $fixes++
} else { Write-Host "FIX 2 SKIP" }

# FIX 3 - JobBoard: move jobSearch state before loading return, fix hooks order
$old3 = '  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-gray-400">
      <div className="w-5 h-5 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" />
      <span>Loading jobs...</span>
    </div>
  )
  const [jobSearch, setJobSearch] = React.useState('''')'

$new3 = '  const [jobSearch, setJobSearch] = React.useState('''')
  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-gray-400">
      <div className="w-5 h-5 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" />
      <span>Loading jobs...</span>
    </div>
  )'

if ($content.Contains($old3)) {
  $content = $content.Replace($old3, $new3)
  Write-Host "FIX 3 OK - jobSearch state moved before loading return"
  $fixes++
} else { Write-Host "FIX 3 SKIP" }

# FIX 4 - JobBoard: inject search input into return
$old4 = '    <div className="flex flex-col h-full">

      {columns.map(col => {'

$new4 = '    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-1 pb-3 shrink-0">
        <div className="relative w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={jobSearch} onChange={e => setJobSearch(e.target.value)} placeholder="Search job number, client, description..." className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white shadow-sm" />
        </div>
        {jq && <span className="text-xs text-gray-500">{filteredJobs.length} result{filteredJobs.length !== 1 ? ''s'' : ''''}</span>}
        {jq && <button onClick={() => setJobSearch('''')} className="text-xs text-blue-500 hover:underline">Clear</button>}
      </div>
      <div className="flex gap-4 flex-1 overflow-x-auto pb-2">
      {columns.map(col => {'

if ($content.Contains($old4)) {
  $content = $content.Replace($old4, $new4)
  Write-Host "FIX 4 OK - JobBoard search input injected"
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
