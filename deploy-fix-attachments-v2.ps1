# deploy-fix-attachments-v2.ps1
$f = Join-Path $PSScriptRoot "src\App.tsx"
if (-not (Test-Path $f)) { Write-Host "ERROR: App.tsx not found." -ForegroundColor Red; exit 1 }

$lines = [System.IO.File]::ReadAllLines($f)
$lineList = New-Object System.Collections.Generic.List[string]
foreach ($line in $lines) { $lineList.Add($line) }
Write-Host "Total lines: $($lineList.Count)" -ForegroundColor Cyan

$stateLine = -1; $effectLine = -1; $displayLine = -1
for ($i = 0; $i -lt $lineList.Count; $i++) {
    if ($lineList[$i] -match 'useState\(true\)' -and $lineList[$i] -match 'panelAttachments' -and $stateLine -lt 0) { $stateLine = $i }
    if ($lineList[$i] -match 'setLoadingItems\(false\)' -and $lineList[$i] -match 'rfq_attachments' -and $effectLine -lt 0) { $effectLine = $i }
    if ($lineList[$i] -match 'panelAttachments\.length' -and $lineList[$i].Length -gt 100 -and $displayLine -lt 0) { $displayLine = $i }
}
Write-Host "State:$stateLine Effect:$effectLine Display:$displayLine" -ForegroundColor Yellow

if ($stateLine -ge 0) {
    $lineList[$stateLine] = '  const [loadingItems, setLoadingItems] = React.useState(true)'
    $lineList.Insert($stateLine + 1, '  const [panelAttachments, setPanelAttachments] = React.useState<any[]>([])')
    if ($effectLine -gt $stateLine) { $effectLine++ }
    if ($displayLine -gt $stateLine) { $displayLine++ }
    Write-Host "Fixed state" -ForegroundColor Green
}

if ($effectLine -ge 0) {
    $lineList[$effectLine] = '      .finally(() => setLoadingItems(false))'
    $lineList.Insert($effectLine + 1, "    supabase.from('rfq_attachments').select('id,file_name,file_path').eq('rfq_id', rfq.id).then(({ data }) => setPanelAttachments(data || []))")
    if ($displayLine -gt $effectLine) { $displayLine++ }
    Write-Host "Fixed effect" -ForegroundColor Green
}

if ($displayLine -ge 0) {
    $lineList[$displayLine] = '          {panelAttachments.length > 0 && ('
    $lineList.Insert($displayLine + 1, '            <div className="px-5 py-4 border-b border-gray-100">')
    $lineList.Insert($displayLine + 2, '              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Attachments</p>')
    $lineList.Insert($displayLine + 3, '              <div className="space-y-1.5">')
    $lineList.Insert($displayLine + 4, "                {panelAttachments.map(att => (")
    $lineList.Insert($displayLine + 5, '                  <a key={att.id}')
    $lineList.Insert($displayLine + 6, "                    href={supabase.storage.from('rfq-attachments').getPublicUrl(att.file_path).data.publicUrl}")
    $lineList.Insert($displayLine + 7, '                    target="_blank" rel="noopener noreferrer"')
    $lineList.Insert($displayLine + 8, '                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 transition-colors">')
    $lineList.Insert($displayLine + 9, '                    <FileText size={13} className="text-blue-500 shrink-0" />')
    $lineList.Insert($displayLine + 10, '                    <span className="text-xs font-medium text-blue-700 truncate">{att.file_name}</span>')
    $lineList.Insert($displayLine + 11, '                  </a>')
    $lineList.Insert($displayLine + 12, '                ))}')
    $lineList.Insert($displayLine + 13, '              </div>')
    $lineList.Insert($displayLine + 14, '            </div>')
    $lineList.Insert($displayLine + 15, '          )}')
    Write-Host "Fixed display block" -ForegroundColor Green
}

[System.IO.File]::WriteAllLines($f, $lineList.ToArray(), [System.Text.Encoding]::ASCII)
Write-Host "Done!" -ForegroundColor Green
