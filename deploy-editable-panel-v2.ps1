# deploy-editable-panel-v2.ps1
# Uses line numbers to replace read-only sections with editable fields
# Run from project root: powershell -ExecutionPolicy Bypass -File deploy-editable-panel-v2.ps1

$f = Join-Path $PSScriptRoot "src\App.tsx"
if (-not (Test-Path $f)) { Write-Host "ERROR: App.tsx not found." -ForegroundColor Red; exit 1 }

$lines = [System.IO.File]::ReadAllLines($f)
$total = $lines.Count
Write-Host "Total lines: $total" -ForegroundColor Cyan

# Find the CLIENT INFO comment line
$clientInfoLine = -1
$saveQuoteLine = -1
$saveActionMsgLine = -1

for ($i = 0; $i -lt $total; $i++) {
    if ($lines[$i] -match 'CLIENT INFO' -and $clientInfoLine -lt 0) { $clientInfoLine = $i }
    if ($lines[$i] -match "const handleSaveQuote = async" -and $saveQuoteLine -lt 0) { $saveQuoteLine = $i }
    if ($lines[$i] -match "setActionMsg.*null" -and $saveActionMsgLine -lt 0) { $saveActionMsgLine = $i }
}

Write-Host "CLIENT INFO line: $clientInfoLine" -ForegroundColor Green
Write-Host "handleSaveQuote line: $saveQuoteLine" -ForegroundColor Green
Write-Host "actionMsg state line: $saveActionMsgLine" -ForegroundColor Green

if ($clientInfoLine -lt 0 -or $saveQuoteLine -lt 0) {
    Write-Host "ERROR: Could not find required markers" -ForegroundColor Red
    exit 1
}

# ── STEP 1: Add edit state vars after actionMsg state ─────────────────────────
$editStateVars = @'

  // Editable RFQ fields state
  const [editContactPerson, setEditContactPerson] = React.useState(rfq.contact_person || '')
  const [editContactEmail, setEditContactEmail] = React.useState(rfq.contact_email || '')
  const [editContactPhone, setEditContactPhone] = React.useState(rfq.contact_phone || '')
  const [editClientRfqNumber, setEditClientRfqNumber] = React.useState(rfq.client_rfq_number || '')
  const [editDrawingNumber, setEditDrawingNumber] = React.useState(rfq.drawing_number || '')
  const [editRequestedBy, setEditRequestedBy] = React.useState(rfq.requested_by || '')
  const [editMediaReceived, setEditMediaReceived] = React.useState(rfq.media_received || '')
  const [editOperatingEntity, setEditOperatingEntity] = React.useState(rfq.operating_entity || 'ERHA FC')
  const [editDateReceived, setEditDateReceived] = React.useState(rfq.request_date || '')
  const [editRequiredBy, setEditRequiredBy] = React.useState(rfq.required_date || '')
  const [editPriority, setEditPriority] = React.useState(rfq.priority || 'MEDIUM')
  const [editDepartmentCG, setEditDepartmentCG] = React.useState(rfq.department_cg || '')
  const [editActions, setEditActions] = React.useState<string[]>((rfq.actions_required || '').split(',').filter(Boolean))
  const [editDescription, setEditDescription] = React.useState(rfq.description || '')
  const [editSpecialReqs, setEditSpecialReqs] = React.useState(rfq.special_requirements || '')
  const [editNotes, setEditNotes] = React.useState(rfq.notes || '')
'@

# ── STEP 2: handleSaveRFQDetails function ─────────────────────────────────────
$saveRFQHandler = @'
  const handleSaveRFQDetails = async () => {
    setSaving(true)
    try {
      const { data, error } = await supabase.from('rfqs').update({
        contact_person: editContactPerson || null,
        contact_email: editContactEmail || null,
        contact_phone: editContactPhone || null,
        client_rfq_number: editClientRfqNumber || null,
        drawing_number: editDrawingNumber || null,
        requested_by: editRequestedBy || null,
        media_received: editMediaReceived || null,
        operating_entity: editOperatingEntity,
        request_date: editDateReceived || null,
        required_date: editRequiredBy || null,
        priority: editPriority,
        department_cg: editDepartmentCG || null,
        actions_required: editActions.join(',') || null,
        description: editDescription.trim(),
        special_requirements: editSpecialReqs || null,
        notes: editNotes || null,
      }).eq('id', rfq.id).select('*, clients(company_name)').single()
      if (error) throw error
      onUpdate(data)
      showMsg('RFQ details saved')
    } catch (e: any) { alert('Error: ' + e.message) }
    finally { setSaving(false) }
  }

'@

# ── STEP 3: New editable sections JSX ─────────────────────────────────────────
$editableSections = @'
          {/* EDITABLE RFQ DETAILS */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">RFQ Details</p>
              <button onClick={handleSaveRFQDetails} disabled={saving}
                className="px-3 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            <p className="text-xs font-medium text-gray-500 mb-2">Client Information</p>
            <div className="grid grid-cols-2 gap-2 mb-4 pb-4 border-b border-gray-100">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Company</label>
                <p className="text-xs text-gray-700 px-2 py-1.5 bg-gray-50 rounded border border-gray-100">{rfq.clients?.company_name || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Client RFQ Number</label>
                <input value={editClientRfqNumber} onChange={e => setEditClientRfqNumber(e.target.value)}
                  className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Contact Person</label>
                <input value={editContactPerson} onChange={e => setEditContactPerson(e.target.value)}
                  className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Contact Email</label>
                <input type="email" value={editContactEmail} onChange={e => setEditContactEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Contact Phone</label>
                <input value={editContactPhone} onChange={e => setEditContactPhone(e.target.value)}
                  className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400" />
              </div>
            </div>

            <p className="text-xs font-medium text-gray-500 mb-2">ENQ Report</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Drawing Number</label>
                <input value={editDrawingNumber} onChange={e => setEditDrawingNumber(e.target.value)}
                  className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Requested / Received By</label>
                <input value={editRequestedBy} onChange={e => setEditRequestedBy(e.target.value)}
                  className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Media Received</label>
                <select value={editMediaReceived} onChange={e => setEditMediaReceived(e.target.value)}
                  className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400 bg-white">
                  <option value="">Select...</option>
                  {['Email','WhatsApp','Phone','Walk-in','Fax'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Operating Entity</label>
                <select value={editOperatingEntity} onChange={e => setEditOperatingEntity(e.target.value)}
                  className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400 bg-white">
                  {OPERATING_ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Date Received</label>
                <input type="date" value={editDateReceived} onChange={e => setEditDateReceived(e.target.value)}
                  className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Required By</label>
                <input type="date" value={editRequiredBy} onChange={e => setEditRequiredBy(e.target.value)}
                  className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Priority</label>
                <select value={editPriority} onChange={e => setEditPriority(e.target.value)}
                  className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400 bg-white">
                  {['LOW','MEDIUM','HIGH','URGENT'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="text-xs text-gray-500 block mb-1">Department CG</label>
              <div className="flex flex-wrap gap-3">
                {['MELTSHOP','MILLS','SHARON','OREN','STORES','GENERAL','MRSTO'].map(d => (
                  <label key={d} className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="editDeptCG" value={d} checked={editDepartmentCG === d} onChange={() => setEditDepartmentCG(d)} className="accent-orange-500" />
                    <span className="text-xs text-gray-700">{d}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-3">
              <label className="text-xs text-gray-500 block mb-1">Actions Required</label>
              <div className="flex flex-wrap gap-1.5">
                {['QUOTE','CUT','SERVICE','REPAIR','PAINT','MANUFACTURE','MODIFY','MACHINING','SANDBLAST','BREAKDOWN','SUPPLY','CHANGE','INSTALLATION','OTHER'].map(a => (
                  <button key={a} onClick={() => setEditActions(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])}
                    className={`px-2 py-0.5 rounded text-xs font-medium border transition-all ${editActions.includes(a) ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-300 hover:border-orange-300'}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Description *</label>
                <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={2}
                  className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400 resize-none" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Special Requirements</label>
                <textarea value={editSpecialReqs} onChange={e => setEditSpecialReqs(e.target.value)} rows={2}
                  className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400 resize-none" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Internal Notes</label>
                <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={2}
                  className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400 resize-none" />
              </div>
            </div>
          </div>
'@

# ── APPLY CHANGES ─────────────────────────────────────────────────────────────

# Convert to list for manipulation
$lineList = New-Object System.Collections.Generic.List[string]
foreach ($line in $lines) { $lineList.Add($line) }

# Find the LINE ITEMS comment to know where to stop removing
$lineItemsLine = -1
for ($i = $clientInfoLine; $i -lt $total; $i++) {
    if ($lines[$i] -match 'LINE ITEMS') { $lineItemsLine = $i; break }
}

Write-Host "LINE ITEMS line: $lineItemsLine" -ForegroundColor Green

# Remove lines from CLIENT INFO to just before LINE ITEMS (lines $clientInfoLine to $lineItemsLine-1)
$removeCount = $lineItemsLine - $clientInfoLine
Write-Host "Removing $removeCount lines and replacing with editable sections..." -ForegroundColor Yellow

for ($i = 0; $i -lt $removeCount; $i++) {
    $lineList.RemoveAt($clientInfoLine)
}

# Insert the new editable sections at that position
$lineList.Insert($clientInfoLine, $editableSections)

# Now find saveQuoteLine in the updated list
$newSaveQuoteLine = -1
for ($i = 0; $i -lt $lineList.Count; $i++) {
    if ($lineList[$i] -match 'const handleSaveQuote = async') { $newSaveQuoteLine = $i; break }
}

Write-Host "handleSaveQuote now at line: $newSaveQuoteLine" -ForegroundColor Green

# Insert handleSaveRFQDetails before handleSaveQuote
$lineList.Insert($newSaveQuoteLine, $saveRFQHandler)

# Now find actionMsg line and insert edit state vars after it
$newActionMsgLine = -1
for ($i = 0; $i -lt $lineList.Count; $i++) {
    if ($lineList[$i] -match "setActionMsg.*null\)") { $newActionMsgLine = $i; break }
}

Write-Host "actionMsg state now at line: $newActionMsgLine" -ForegroundColor Green
$lineList.Insert($newActionMsgLine + 1, $editStateVars)

# Write back
[System.IO.File]::WriteAllLines($f, $lineList.ToArray(), [System.Text.Encoding]::ASCII)

Write-Host ""
Write-Host "Done! Panel is now fully editable." -ForegroundColor Green
Write-Host "All RFQ fields can be edited and saved with the 'Save Changes' button." -ForegroundColor White
