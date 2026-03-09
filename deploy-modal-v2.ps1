# deploy-modal-v2.ps1
# Replaces CreateRFQModal in App.tsx with updated version
# - Removes ENQ number from form (auto-generated on save)
# - Adds Client RFQ number field
# - Simplified line items (Type, Description, Qty, UOM - no pricing)
# - Document attachments via Supabase Storage rfq-attachments bucket
# Run from project root: powershell -ExecutionPolicy Bypass -File deploy-modal-v2.ps1

$projectRoot = $PSScriptRoot
$appTsxPath = Join-Path $projectRoot "src\App.tsx"

if (-not (Test-Path $appTsxPath)) {
    Write-Host "ERROR: App.tsx not found at $appTsxPath" -ForegroundColor Red
    Write-Host "Make sure you run this script from the project root." -ForegroundColor Yellow
    exit 1
}

Write-Host "Reading App.tsx..." -ForegroundColor Cyan
$content = [System.IO.File]::ReadAllText($appTsxPath, [System.Text.Encoding]::UTF8)

# ── NEW MODAL CODE ────────────────────────────────────────────────────────────
$newModal = @'
function CreateRFQModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [saving, setSaving] = React.useState(false)
  const [uploadingFiles, setUploadingFiles] = React.useState(false)
  const [clients, setClients] = React.useState<any[]>([])
  const [showNewClient, setShowNewClient] = React.useState(false)
  const [newClientName, setNewClientName] = React.useState('')
  const [attachments, setAttachments] = React.useState<Array<{ name: string; path: string; size: number }>>([])
  const [form, setForm] = React.useState({
    rfq_direction: 'INCOMING',
    operating_entity: 'ERHA FC',
    client_rfq_number: '',
    priority: 'MEDIUM',
    request_date: new Date().toISOString().split('T')[0],
    required_date: '',
    client_id: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    media_received: 'Email',
    department_cg: '',
    actions_required: [] as string[],
    drawing_number: '',
    description: '',
    special_requirements: '',
    notes: '',
  })
  const [lineItems, setLineItems] = React.useState([
    { item_type: 'MATERIAL', description: '', quantity: 1, unit_of_measure: 'EA' }
  ])

  React.useEffect(() => {
    supabase.from('clients').select('id, company_name').order('company_name').then(({ data }) => {
      if (data) setClients(data)
    })
  }, [])

  const set = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }))

  const toggleAction = (action: string) => {
    setForm(f => ({
      ...f,
      actions_required: f.actions_required.includes(action)
        ? f.actions_required.filter((a: string) => a !== action)
        : [...f.actions_required, action]
    }))
  }

  const addLineItem = () => setLineItems(li => [...li, { item_type: 'MATERIAL', description: '', quantity: 1, unit_of_measure: 'EA' }])
  const removeLineItem = (i: number) => setLineItems(li => li.filter((_, idx) => idx !== i))
  const updateLineItem = (i: number, field: string, value: any) =>
    setLineItems(li => li.map((item, idx) => idx === i ? { ...item, [field]: value } : item))

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadingFiles(true)
    const uploaded: Array<{ name: string; path: string; size: number }> = []
    for (const file of Array.from(files)) {
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
      const path = `rfq-drafts/${Date.now()}-${safeName}`
      const { error } = await supabase.storage.from('rfq-attachments').upload(path, file)
      if (!error) uploaded.push({ name: file.name, path, size: file.size })
      else console.error('Upload error:', error.message)
    }
    setAttachments(prev => [...prev, ...uploaded])
    setUploadingFiles(false)
    e.target.value = ''
  }

  const removeAttachment = async (path: string) => {
    await supabase.storage.from('rfq-attachments').remove([path])
    setAttachments(prev => prev.filter(a => a.path !== path))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleSave = async () => {
    if (!form.client_id && !showNewClient) { alert('Please select a client'); return }
    if (showNewClient && !newClientName.trim()) { alert('Please enter the new client name'); return }
    if (!form.description.trim()) { alert('Description is required'); return }
    setSaving(true)
    try {
      let clientId = form.client_id
      if (showNewClient && newClientName.trim()) {
        const { data: nc, error: ce } = await supabase
          .from('clients')
          .insert({ company_name: newClientName.trim() })
          .select('id')
          .single()
        if (ce) throw ce
        if (nc) clientId = nc.id
      }

      // Auto-generate ENQ number
      const { count } = await supabase.from('rfqs').select('*', { count: 'exact', head: true })
      const enqNumber = `ENQ-26-${String((count || 0) + 1).padStart(4, '0')}`

      const { data: rfq, error: rfqError } = await supabase.from('rfqs').insert({
        enq_number: enqNumber,
        rfq_no: enqNumber,
        rfq_direction: form.rfq_direction,
        operating_entity: form.operating_entity,
        client_rfq_number: form.client_rfq_number || null,
        priority: form.priority,
        request_date: form.request_date || null,
        required_date: form.required_date || null,
        client_id: clientId,
        contact_person: form.contact_person || null,
        contact_email: form.contact_email || null,
        contact_phone: form.contact_phone || null,
        media_received: form.media_received || null,
        department_cg: form.department_cg || null,
        actions_required: form.actions_required.length > 0 ? form.actions_required.join(',') : null,
        drawing_number: form.drawing_number || null,
        description: form.description.trim(),
        special_requirements: form.special_requirements || null,
        notes: form.notes || null,
        status: 'NEW',
      }).select('id').single()

      if (rfqError) throw rfqError

      // Insert line items (skip empty rows)
      const validItems = lineItems.filter(li => li.description.trim())
      if (validItems.length > 0) {
        const { error: liError } = await supabase.from('rfq_line_items').insert(
          validItems.map((li, i) => ({
            rfq_id: rfq.id,
            line_number: i + 1,
            item_type: li.item_type,
            description: li.description.trim(),
            quantity: li.quantity,
            unit_of_measure: li.unit_of_measure,
          }))
        )
        if (liError) console.error('Line items error:', liError.message)
      }

      // Move attachments from draft path to final RFQ folder
      for (const att of attachments) {
        const safeName = att.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
        const finalPath = `${rfq.id}/${safeName}`
        const { error: moveErr } = await supabase.storage
          .from('rfq-attachments')
          .move(att.path, finalPath)
        if (!moveErr) {
          await supabase.from('rfq_attachments').insert({
            rfq_id: rfq.id,
            file_name: att.name,
            file_path: finalPath,
            file_size: att.size,
          })
        }
      }

      onCreated()
      onClose()
    } catch (err: any) {
      alert('Error creating RFQ: ' + (err.message || String(err)))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">New RFQ</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">✕</button>
        </div>

        <div className="px-6 py-5 space-y-6 max-h-[75vh] overflow-y-auto">

          {/* ── Section 1: Direction & Identity ── */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Direction & Reference</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {(['INCOMING', 'OUTGOING'] as const).map(dir => (
                <button key={dir} type="button" onClick={() => set('rfq_direction', dir)}
                  className={`py-3 rounded-lg border-2 text-sm font-semibold transition-all text-left px-4 ${
                    form.rfq_direction === dir
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}>
                  <div>{dir === 'INCOMING' ? '📥 INCOMING' : '📤 OUTGOING'}</div>
                  <div className="text-xs font-normal mt-0.5 opacity-70">
                    {dir === 'INCOMING' ? 'Client requesting from ERHA' : 'ERHA requesting from supplier'}
                  </div>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Operating Entity</label>
                <select value={form.operating_entity} onChange={e => set('operating_entity', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {OPERATING_ENTITIES.map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
                <select value={form.priority} onChange={e => set('priority', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Client RFQ / Reference No.</label>
                <input type="text" value={form.client_rfq_number} onChange={e => set('client_rfq_number', e.target.value)}
                  placeholder="Client's reference number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Media Received</label>
                <select value={form.media_received} onChange={e => set('media_received', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {MEDIA_OPTIONS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date Received</label>
                <input type="date" value={form.request_date} onChange={e => set('request_date', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Required By</label>
                <input type="date" value={form.required_date} onChange={e => set('required_date', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* ── Section 2: Client ── */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Client</p>
            {!showNewClient ? (
              <div className="flex gap-2 mb-3">
                <select value={form.client_id} onChange={e => set('client_id', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Select client —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
                <button type="button" onClick={() => setShowNewClient(true)}
                  className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 whitespace-nowrap font-medium">
                  + New Client
                </button>
              </div>
            ) : (
              <div className="flex gap-2 mb-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">New Client Name *</label>
                  <input type="text" value={newClientName} onChange={e => setNewClientName(e.target.value)}
                    placeholder="Company name" autoFocus
                    className="w-full border border-blue-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <button type="button" onClick={() => { setShowNewClient(false); setNewClientName('') }}
                  className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600">
                  Cancel
                </button>
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Contact Person</label>
                <input type="text" value={form.contact_person} onChange={e => set('contact_person', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Contact Email</label>
                <input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Contact Phone</label>
                <input type="text" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* ── Section 3: Job Detail ── */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Job Detail</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
                <select value={form.department_cg} onChange={e => set('department_cg', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Select department —</option>
                  {DEPARTMENTS_CG.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Drawing Number</label>
                <input type="text" value={form.drawing_number} onChange={e => set('drawing_number', e.target.value)}
                  placeholder="DWG-001"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-2">Actions Required</label>
              <div className="flex flex-wrap gap-1.5">
                {ACTIONS_LIST.map(a => (
                  <button key={a} type="button" onClick={() => toggleAction(a)}
                    className={`px-2.5 py-1 rounded text-xs font-medium border transition-all ${
                      form.actions_required.includes(a)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                    }`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
                placeholder="Describe the work required..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Special Requirements</label>
                <textarea value={form.special_requirements} onChange={e => set('special_requirements', e.target.value)}
                  rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                  rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
          </div>

          {/* ── Section 4: Line Items ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Line Items</p>
              <button type="button" onClick={addLineItem}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
                + Add Item
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 w-36">Type</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Description</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 w-20">Qty</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 w-20">UOM</th>
                    <th className="w-8 px-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lineItems.map((li, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1.5">
                        <select value={li.item_type} onChange={e => updateLineItem(i, 'item_type', e.target.value)}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                          {ITEM_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="text" value={li.description}
                          onChange={e => updateLineItem(i, 'description', e.target.value)}
                          placeholder="Item description"
                          className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" min="0" step="0.01" value={li.quantity}
                          onChange={e => updateLineItem(i, 'quantity', parseFloat(e.target.value) || 1)}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </td>
                      <td className="px-2 py-1.5">
                        <select value={li.unit_of_measure}
                          onChange={e => updateLineItem(i, 'unit_of_measure', e.target.value)}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                          {UOM_OPTIONS.map(u => <option key={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        {lineItems.length > 1 && (
                          <button type="button" onClick={() => removeLineItem(i)}
                            className="text-red-400 hover:text-red-600 text-sm leading-none">✕</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Section 5: Attachments ── */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Attachments</p>
            <label className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              uploadingFiles
                ? 'border-blue-300 bg-blue-50 cursor-wait'
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }`}>
              <span className="text-2xl">{uploadingFiles ? '⏳' : '📎'}</span>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {uploadingFiles ? 'Uploading files...' : 'Click to attach files'}
                </p>
                <p className="text-xs text-gray-400">Any file type · Up to 50 MB each · Multiple allowed</p>
              </div>
              <input type="file" multiple onChange={handleFileChange} className="hidden" disabled={uploadingFiles} />
            </label>
            {attachments.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {attachments.map((att, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm flex-shrink-0">📄</span>
                      <span className="text-xs font-medium text-gray-700 truncate">{att.name}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0">{formatFileSize(att.size)}</span>
                    </div>
                    <button type="button" onClick={() => removeAttachment(att.path)}
                      className="text-red-400 hover:text-red-600 text-xs ml-2 flex-shrink-0">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving || uploadingFiles}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {saving ? 'Creating...' : 'Create RFQ'}
          </button>
        </div>
      </div>
    </div>
  )
}
'@

# ── FIND AND REPLACE ──────────────────────────────────────────────────────────
# Find the start of CreateRFQModal
$startMarker = 'function CreateRFQModal('
$startIdx = $content.IndexOf($startMarker)

if ($startIdx -lt 0) {
    Write-Host "ERROR: Could not find 'function CreateRFQModal(' in App.tsx" -ForegroundColor Red
    Write-Host "The function may have been renamed. Check App.tsx manually." -ForegroundColor Yellow
    exit 1
}

Write-Host "Found CreateRFQModal at position $startIdx" -ForegroundColor Green

# Find the next top-level function after CreateRFQModal
# We look for the pattern: two newlines + 'function ' (top-level function boundary)
$searchFrom = $startIdx + $startMarker.Length
$nextFnPattern = "`nfunction "
$nextFnIdx = $content.IndexOf($nextFnPattern, $searchFrom)

if ($nextFnIdx -lt 0) {
    # Try export default as fallback
    $nextFnPattern = "`nexport default"
    $nextFnIdx = $content.IndexOf($nextFnPattern, $searchFrom)
}

if ($nextFnIdx -lt 0) {
    Write-Host "ERROR: Could not find the end boundary of CreateRFQModal" -ForegroundColor Red
    exit 1
}

Write-Host "Replacement boundary: $startIdx to $nextFnIdx" -ForegroundColor Green

# Build the new content
$before = $content.Substring(0, $startIdx)
$after  = $content.Substring($nextFnIdx)  # starts with \nfunction ...
$newContent = $before + $newModal + "`n" + $after

# ── WRITE BACK ────────────────────────────────────────────────────────────────
[System.IO.File]::WriteAllText($appTsxPath, $newContent, [System.Text.Encoding]::ASCII)

Write-Host ""
Write-Host "Done! CreateRFQModal replaced successfully." -ForegroundColor Green
Write-Host ""
Write-Host "Changes in this version:" -ForegroundColor Cyan
Write-Host "  - ENQ number removed from form (auto-generated on save as ENQ-26-XXXX)" -ForegroundColor White
Write-Host "  - Client RFQ reference number field added" -ForegroundColor White
Write-Host "  - Simplified line items: Type, Description, Qty, UOM (no pricing)" -ForegroundColor White
Write-Host "  - File attachments: uploads to Supabase rfq-attachments bucket" -ForegroundColor White
Write-Host "  - Multiple file support, any file type, up to 50MB each" -ForegroundColor White
Write-Host ""
Write-Host "Next: npm run dev  then test New RFQ button" -ForegroundColor Yellow
