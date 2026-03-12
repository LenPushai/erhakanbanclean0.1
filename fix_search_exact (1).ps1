# ERHA - Insert search bar at exact lines
$file = "src\App.tsx"
$lines = [System.Collections.Generic.List[string]]([System.IO.File]::ReadAllLines($file))

Write-Host "Lines before: $($lines.Count)"

# Show what we have at the return area
Write-Host "Line 285: $($lines[284])"
Write-Host "Line 286: $($lines[285])"
Write-Host "Line 287: $($lines[286])"
Write-Host "Line 288: $($lines[287])"
Write-Host ""

# Check if search bar already in return
$hasSearchBar = $false
for ($i = 284; $i -le 295; $i++) {
  if ($lines[$i] -match "woSearch|Search WO") { $hasSearchBar = $true }
}

if ($hasSearchBar) {
  Write-Host "Search bar already present - no changes needed"
  exit
}

# Line 286 (index 285) is: <div className="flex gap-4 h-full"...
# We need to:
# 1. Replace that line with flex-col wrapper + search bar + inner flex div
# 2. Add closing </div> before the closing </div> of the return

# Step 1: Replace line 286 (index 285) - the outer div
$lines[285] = '    <div className="flex flex-col h-full">'

# Step 2: Insert search bar after line 286 (now index 285)
$searchLines = @(
  '      <div className="flex items-center gap-3 pb-3 shrink-0">',
  '        <div className="relative">',
  '          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />',
  '          <input value={woSearch} onChange={e => setWoSearch(e.target.value)} placeholder="Search WO number, client, description..." className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white w-80" />',
  '        </div>',
  '        {woQ && <span className="text-xs text-gray-500">{woFiltered.length} result{woFiltered.length !== 1 ? "s" : ""}</span>}',
  '        {woQ && <button onClick={() => setWoSearch("")} className="text-xs text-blue-500 hover:underline">Clear</button>}',
  '      </div>',
  '      <div className="flex gap-4 overflow-x-auto flex-1" style={{ minWidth: "max-content" }}>'
)
for ($i = $searchLines.Length - 1; $i -ge 0; $i--) {
  $lines.Insert(286, $searchLines[$i])
}
Write-Host "Inserted search bar (9 lines) after line 286"

# Step 3: Find the RFQ card filter line and update to use woFiltered
# Find: const cards = rfqs.filter(r => r.status === col.key)
for ($i = 285; $i -le 310; $i++) {
  if ($lines[$i] -match "const cards = rfqs.filter") {
    $lines[$i] = "        const cards = woFiltered.filter(r => r.status === col.key)"
    Write-Host "Updated cards filter at line $($i+1)"
    break
  }
}

# Step 4: Find closing </div> of RFQBoard and add extra </div> before it
# Find the pattern: })}  then </div>  then )  then }  then // RFQ CARD
for ($i = $lines.Count - 1; $i -gt 285; $i--) {
  if ($lines[$i] -match "^// RFQ CARD") {
    # Go back to find the </div> closing
    for ($j = $i - 1; $j -gt 285; $j--) {
      if ($lines[$j] -match "^\s+</div>$" -and $lines[$j-1] -match "^\s+\)$") {
        $lines.Insert($j, '      </div>')
        Write-Host "Inserted closing </div> at line $($j+1)"
        break
      }
    }
    break
  }
}

[System.IO.File]::WriteAllLines($file, $lines, [System.Text.Encoding]::ASCII)
Write-Host ""
Write-Host "DONE - Lines after: $($lines.Count)"
Write-Host ""
Write-Host "Check line 286:"
$verify = [System.IO.File]::ReadAllLines($file)
Write-Host "$($verify[285])"
Write-Host "$($verify[286])"
Write-Host ""
Read-Host "Press Enter to close"
