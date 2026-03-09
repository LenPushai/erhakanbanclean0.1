# deploy-fix-attachments.ps1
# Fixes attachment state, fetch and display in RFQDetailPanel
# Run from project root: powershell -ExecutionPolicy Bypass -File deploy-fix-attachments.ps1

$f = Join-Path $PSScriptRoot "src\App.tsx"
if (-not (Test-Path $f)) { Write-Host "ERROR: App.tsx not found." -ForegroundColor Red; exit 1 }

$lines = [System.IO.File]::ReadAllLines($f)
$lineList = New-Object System.Collections.Generic.List[string]
foreach ($line in $lines) { $lineList.Add($line) }

$total = $lineList.Count
Write-Host "Total lines: $total" -ForegroundColor Cyan

# ── STEP 1: Fix the broken state line (line with literal \r\n in it) ──────────
for ($i = 0; $i -lt $lineList.Count; $i++) {
    if ($lineList[$i] -match "loadingItems.*panelAttachments" -or $lineList[$i] -match 'useState\(true\).*panelAttachments') {
        $lineList[$i] = '  const [loadingItems, setLoadingItems] = React.useState(true)'
        $lineList.Insert($i + 1, '  const [panelAttachments, setPanelAttachments] = React.useState<any[]>([])')
        Write-Host "Fixed state at line $i" -ForegroundColor Green
        break
    }
}

# ── STEP 2: Fix the broken useEffect line ─────────────────────────────────────
for ($i = 0; $i -lt $lineList.Count; $i++) {
    if ($lineList[$i] -match "finally.*setLoadingItems.*rfq_attachments") {
        $lineList[$i] = '      .finally(() => setLoadingItems(false))'
        $lineList.Insert($i + 1, '    supabase.from(''rfq_attachments'').select(''id,file_name,file_path'').eq(''rfq_id'', rfq.id).then(({ data }) => setPanelAttachments(data || []))')
        Write-Host "Fixed useEffect at line $i" -ForegroundColor Green
        break
    }
}

# ── STEP 3: Remove the broken attachment display block ─────────────────────────
$brokenStart = -1
for ($i = 0; $i -lt $lineList.Count; $i++) {
    if ($lineList[$i] -match "panelAttachments\.length > 0.*\\\\r\\\\n" -or ($lineList[$i] -match "panelAttachments\.length > 0" -and $lineList[$i].Length -gt 200)) {
        $brokenStart = $i
        Write-Host "Found broken attachment block at line $i" -ForegroundColor Yellow
        break
    }
}

if ($brokenStart -ge 0) {
    $lineList.RemoveAt($brokenStart)
    Write-Host "Removed broken attachment block" -ForegroundColor Green
}

# ── STEP 4: Insert clean attachment display before assigned_quoter_name block ──
$insertPoint = -1
for ($i = 0; $i -lt $lineList.Count; $i++) {
    if ($lineList[$i] -match "rfq\.assigned_quoter_name && \(") {
        $insertPoint = $i
        break
    }
}

Write-Host "Insert point for attachments: $insertPoint" -ForegroundColor Green

$attachmentJSX = @'
          {panelAttachments.length > 0 && (
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Attachments</p>
              <div className="space-y-1.5">
                {panelAttachments.map(att => (
                  <a key={att.id}
                    href={supabase.storage.from('rfq-attachments').getPublicUrl(att.file_path).data.publicUrl}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 transition-colors">
                    <FileText size={13} className="text-blue-500 shrink-0" />
                    <span className="text-xs font-medium text-blue-700 truncate">{att.file_name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
'@

if ($insertPoint -ge 0) {
    $lineList.Insert($insertPoint, $attachmentJSX)
    Write-Host "Inserted clean attachment display" -ForegroundColor Green
}

[System.IO.File]::WriteAllLines($f, $lineList.ToArray(), [System.Text.Encoding]::ASCII)

Write-Host ""
Write-Host "Done! Attachments will now display as blue clickable links in the panel." -ForegroundColor Green
