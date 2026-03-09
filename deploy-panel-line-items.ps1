# deploy-panel-line-items.ps1
# Replaces read-only line items section in RFQDetailPanel with editable version
# Run from project root: powershell -ExecutionPolicy Bypass -File deploy-panel-line-items.ps1

$f = Join-Path $PSScriptRoot "src\App.tsx"
if (-not (Test-Path $f)) { Write-Host "ERROR: App.tsx not found." -ForegroundColor Red; exit 1 }

$lines = [System.IO.File]::ReadAllLines($f)
$total = $lines.Count
Write-Host "Total lines: $total" -ForegroundColor Cyan

# Find the Section title Line Items line
$startLine = -1
$endLine   = -1

for ($i = 0; $i -lt $total; $i++) {
    if ($lines[$i] -match "Section title=.Line Items" -and $startLine -lt 0) { $startLine = $i }
    if ($startLine -gt 0 -and $lines[$i] -match "rfq\.assigned_quoter_name && \(" -and $endLine -lt 0) { $endLine = $i }
}

Write-Host "Line Items section: $startLine to $($endLine - 1)" -ForegroundColor Green

if ($startLine -lt 0 -or $endLine -lt 0) {
    Write-Host "ERROR: Could not find line items section" -ForegroundColor Red
    exit 1
}

# Also find where to add panel state vars and save handler
$panelLineItemsState = -1
$handleSaveRFQDetails = -1

for ($i = 0; $i -lt $total; $i++) {
    if ($lines[$i] -match "const \[loadingItems" -and $panelLineItemsState -lt 0) { $panelLineItemsState = $i }
    if ($lines[$i] -match "const handleSaveRFQDetails" -and $handleSaveRFQDetails -lt 0) { $handleSaveRFQDetails = $i }
}

Write-Host "loadingItems state line: $panelLineItemsState" -ForegroundColor Green
Write-Host "handleSaveRFQDetails line: $handleSaveRFQDetails" -ForegroundColor Green

# New editable line items JSX
$newLineItems = @'
          {/* EDITABLE LINE ITEMS */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Line Items</p>
              <button onClick={addPanelLineItem}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1">
                + Add Item
              </button>
            </div>
            {loadingItems
              ? <p className="text-xs text-gray-400">Loading...</p>
              : panelLineItems.length === 0
              ? <p className="text-xs text-gray-400 text-center py-3 border border-dashed border-gray-200 rounded-lg">No line items</p>
              : (
                <div className="space-y-1.5 mb-3">
                  <div className="grid grid-cols-12 gap-1.5 text-xs font-medium text-gray-400 px-1 mb-1">
                    <div className="col-span-2">Type</div>
                    <div className="col-span-5">Description</div>
                    <div className="col-span-2">Qty</div>
                    <div className="col-span-2">UOM</div>
                    <div className="col-span-1"></div>
                  </div>
                  {panelLineItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-1.5 items-center">
                      <div className="col-span-2">
                        <select value={item.item_type} onChange={e => updatePanelLineItem(idx, 'item_type', e.target.value)}
                          className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-blue-400 bg-white">
                          {['MATERIAL','LABOUR','SUBCONTRACT','EQUIPMENT','OTHER'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="col-span-5">
                        <input value={item.description} onChange={e => updatePanelLineItem(idx, 'description', e.target.value)}
                          placeholder="Description"
                          className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-blue-400" />
                      </div>
                      <div className="col-span-2">
                        <input type="number" value={item.quantity} onChange={e => updatePanelLineItem(idx, 'quantity', e.target.value)}
                          className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-blue-400" />
                      </div>
                      <div className="col-span-2">
                        <select value={item.unit_of_measure} onChange={e => updatePanelLineItem(idx, 'unit_of_measure', e.target.value)}
                          className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-blue-400 bg-white">
                          {['EA','M','KG','L','SET','LOT','HR','DAY'].map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button onClick={() => removePanelLineItem(idx)} className="text-red-400 hover:text-red-600"><X size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
            {!loadingItems && (
              <button onClick={handleSaveLineItems} disabled={saving}
                className="w-full py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : 'Save Line Items'}
              </button>
            )}
          </div>

'@

# New state vars to add after loadingItems
$newStateVars = @'

  const [panelLineItems, setPanelLineItems] = React.useState<any[]>([])
'@

# New handlers to add before handleSaveRFQDetails
$newHandlers = @'
  const addPanelLineItem = () => setPanelLineItems(prev => [...prev, { item_type: 'MATERIAL', description: '', quantity: '1', unit_of_measure: 'EA', isNew: true }])
  const removePanelLineItem = (idx: number) => setPanelLineItems(prev => prev.filter((_, i) => i !== idx))
  const updatePanelLineItem = (idx: number, field: string, value: string) => setPanelLineItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))

  const handleSaveLineItems = async () => {
    setSaving(true)
    try {
      await supabase.from('rfq_line_items').delete().eq('rfq_id', rfq.id)
      const validItems = panelLineItems.filter(i => i.description?.trim())
      if (validItems.length > 0) {
        const rows = validItems.map((item, idx) => ({
          rfq_id: rfq.id,
          line_number: idx + 1,
          item_type: item.item_type,
          description: item.description.trim(),
          quantity: parseFloat(item.quantity) || 1,
          unit_of_measure: item.unit_of_measure,
        }))
        const { error } = await supabase.from('rfq_line_items').insert(rows)
        if (error) throw error
        setPanelLineItems(rows.map((r, i) => ({ ...r, id: i })))
      } else {
        setPanelLineItems([])
      }
      showMsg('Line items saved')
    } catch (e: any) { alert('Error: ' + e.message) }
    finally { setSaving(false) }
  }

'@

# Also need to update the useEffect to populate panelLineItems instead of lineItems
# Find the useEffect that loads line items
$useEffectLine = -1
for ($i = 0; $i -lt $total; $i++) {
    if ($lines[$i] -match "setLoadingItems\(true\)" -and $i -gt 750) { $useEffectLine = $i; break }
}
Write-Host "useEffect setLoadingItems line: $useEffectLine" -ForegroundColor Green

# ── APPLY ALL CHANGES ──────────────────────────────────────────────────────────
$lineList = New-Object System.Collections.Generic.List[string]
foreach ($line in $lines) { $lineList.Add($line) }

# 1. Replace line items section (work from bottom up to preserve line numbers)
$removeCount = $endLine - $startLine
Write-Host "Replacing $removeCount lines with editable line items..." -ForegroundColor Yellow
for ($i = 0; $i -lt $removeCount; $i++) { $lineList.RemoveAt($startLine) }
$lineList.Insert($startLine, $newLineItems)

# 2. Find and insert handlers before handleSaveRFQDetails (line numbers shifted)
$newHandlerLine = -1
for ($i = 0; $i -lt $lineList.Count; $i++) {
    if ($lineList[$i] -match "const handleSaveRFQDetails") { $newHandlerLine = $i; break }
}
Write-Host "Inserting handlers at line: $newHandlerLine" -ForegroundColor Green
$lineList.Insert($newHandlerLine, $newHandlers)

# 3. Find loadingItems state and add panelLineItems after it
$newLoadingLine = -1
for ($i = 0; $i -lt $lineList.Count; $i++) {
    if ($lineList[$i] -match "const \[loadingItems" -and $i -gt 700) { $newLoadingLine = $i; break }
}
Write-Host "Adding panelLineItems state at line: $($newLoadingLine + 1)" -ForegroundColor Green
$lineList.Insert($newLoadingLine + 1, $newStateVars)

# 4. Update the useEffect to also populate panelLineItems
# Find the .then({ data }) line in the useEffect
$thenLine = -1
for ($i = 0; $i -lt $lineList.Count; $i++) {
    if ($lineList[$i] -match "\.then\(\(\{ data \}\)" -and $i -gt 750 -and $i -lt 870) { $thenLine = $i; break }
}
Write-Host "useEffect .then line: $thenLine" -ForegroundColor Green
if ($thenLine -gt 0) {
    $lineList[$thenLine] = $lineList[$thenLine] -replace '\.then\(\(\{ data \}\) => setLineItems\(data \|\| \[\]\)\)', '.then(({ data }) => { setLineItems(data || []); setPanelLineItems(data || []) })'
}

[System.IO.File]::WriteAllLines($f, $lineList.ToArray(), [System.Text.Encoding]::ASCII)

Write-Host ""
Write-Host "Done! Line items are now editable on the panel." -ForegroundColor Green
Write-Host "  - Add new items with + Add Item button" -ForegroundColor White
Write-Host "  - Edit type, description, qty, UOM inline" -ForegroundColor White
Write-Host "  - Remove items with the X button" -ForegroundColor White
Write-Host "  - Save Line Items replaces all items in the database" -ForegroundColor White
