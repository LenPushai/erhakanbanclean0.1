// CREATE DIRECT JOB MODAL

function CreateDirectJobModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [saving, setSaving] = React.useState(false)
  const [clientName, setClientName] = React.useState('')
  const [siteReq, setSiteReq] = React.useState('')
  const [workType, setWorkType] = React.useState<'contract' | 'quoted'>('contract')
  const [priority, setPriority] = React.useState('NORMAL')
  const [compiledBy, setCompiledBy] = React.useState('')
  const [isEmergency, setIsEmergency] = React.useState(false)
  const [assignedEmployee, setAssignedEmployee] = React.useState('')
  const [assignedSupervisor, setAssignedSupervisor] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const [dateReceived] = React.useState(new Date().toISOString().split('T')[0])
  const [materialOrderedDate, setMaterialOrderedDate] = React.useState('')
  const [completionDate, setCompletionDate] = React.useState('')
  const [dueDate, setDueDate] = React.useState('')
  const [hasDrawing, setHasDrawing] = React.useState(false)
  const [hasServiceSchedule, setHasServiceSchedule] = React.useState(false)
  const [hasInternalOrder, setHasInternalOrder] = React.useState(false)
  const [actions, setActions] = React.useState({
    manufacture: false, sandblast: false, prepare_material: false,
    service: false, paint: false, other: false, repair: false,
    installation: false, cut: false, modify: false
  })
  const [lineItems, setLineItems] = React.useState([{ description: '', quantity: 1, uom: 'Each', notes: '' }])

  const toggleAction = (key: keyof typeof actions) => setActions(a => ({ ...a, [key]: !a[key] }))
  const addLineItem = () => setLineItems(li => [...li, { description: '', quantity: 1, uom: 'Each', notes: '' }])
  const removeLineItem = (i: number) => setLineItems(li => li.filter((_, idx) => idx !== i))
  const updateLineItem = (i: number, field: string, val: any) => setLineItems(li => li.map((item, idx) => idx === i ? { ...item, [field]: val } : item))

  const handleCreate = async () => {
    if (!clientName.trim()) { alert('Client name is required'); return }
    if (!dueDate) { alert('Due date is required'); return }
    setSaving(true)
    try {
      const { data: job, error } = await supabase.from('jobs').insert({
        client_name: clientName.trim(),
        site_req: siteReq.trim() || null,
        is_contract_work: workType === 'contract',
        is_quoted_work: workType === 'quoted',
        priority: priority,
        compiled_by: compiledBy.trim() || null,
        is_emergency: isEmergency,
        assigned_employee_name: assignedEmployee.trim() || null,
        assigned_supervisor_name: assignedSupervisor.trim() || null,
        notes: notes.trim() || null,
        date_received: dateReceived,
        material_ordered_date: materialOrderedDate || null,
        completion_date: completionDate || null,
        due_date: dueDate,
        has_drawing: hasDrawing,
        has_service_schedule: hasServiceSchedule,
        has_internal_order: hasInternalOrder,
        action_manufacture: actions.manufacture,
        action_sandblast: actions.sandblast,
        action_prepare_material: actions.prepare_material,
        action_service: actions.service,
        action_paint: actions.paint,
        action_other: actions.other,
        action_repair: actions.repair,
        action_installation: actions.installation,
        action_cut: actions.cut,
        action_modify: actions.modify,
        entry_type: 'DIRECT',
        status: 'PENDING',
        is_parent: lineItems.filter(l => l.description.trim()).length > 1,
      }).select().single()
      if (error) throw error
      const validItems = lineItems.filter(l => l.description.trim())
      if (validItems.length > 0) {
        await supabase.from('job_line_items').insert(
          validItems.map((item, idx) => ({
            job_id: job.id,
            description: item.description.trim(),
            quantity: item.quantity,
            uom: item.uom,
            specification: item.notes.trim() || null,
            sort_order: idx,
            status: 'PENDING',
            cost_price: 0, sell_price: 0, line_total: 0,
            can_spawn_job: true,
          }))
        )
      }
      onCreated()
    } catch (err: any) {
      alert('Error creating job: ' + err.message)
    } finally { setSaving(false) }
  }

  const uomOptions = ['Each', 'Meter', 'kg', 'Liter', 'Hour', 'Set', 'm2', 'm3']
  const actionList = [
    { key: 'manufacture' as const, label: 'Manufacture' }, { key: 'sandblast' as const, label: 'Sandblast' },
    { key: 'prepare_material' as const, label: 'Prepare Material' }, { key: 'service' as const, label: 'Service' },
    { key: 'paint' as const, label: 'Paint' }, { key: 'other' as const, label: 'Other' },
    { key: 'repair' as const, label: 'Repair' }, { key: 'installation' as const, label: 'Installation' },
    { key: 'cut' as const, label: 'Cut' }, { key: 'modify' as const, label: 'Modify' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="bg-indigo-600 text-white px-6 py-4 rounded-t-xl flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold">Create New Job</h2>
            <p className="text-indigo-200 text-xs mt-0.5">Contract / Direct Work (No RFQ)</p>
          </div>
          <button onClick={onClose} className="text-indigo-200 hover:text-white"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Client *</label><input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Client name..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Job Number</label><div className="px-3 py-2 text-sm text-indigo-600 font-bold bg-indigo-50 rounded-lg border border-indigo-200">Auto (YY-XXXX)</div></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Site Req / PO</label><input value={siteReq} onChange={e => setSiteReq(e.target.value)} placeholder="e.g. PO-12345" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          </div>
          <div className="grid grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Work Type</label>
              <div className="flex rounded-lg overflow-hidden border border-gray-300">
                <button onClick={() => setWorkType('contract')} className={'flex-1 py-2 text-xs font-semibold transition-colors ' + (workType === 'contract' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}>Contract</button>
                <button onClick={() => setWorkType('quoted')} className={'flex-1 py-2 text-xs font-semibold transition-colors ' + (workType === 'quoted' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}>Quoted</button>
              </div>
            </div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Priority</label><select value={priority} onChange={e => setPriority(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"><option value="LOW">Low</option><option value="NORMAL">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Compiled By</label><input value={compiledBy} onChange={e => setCompiledBy(e.target.value)} placeholder="Name..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div className="flex items-center gap-2 pb-2"><input type="checkbox" id="emergency" checked={isEmergency} onChange={e => setIsEmergency(e.target.checked)} className="w-4 h-4 text-red-600" /><label htmlFor="emergency" className="text-sm font-medium text-red-600">Emergency</label></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Assign to Employee</label><input value={assignedEmployee} onChange={e => setAssignedEmployee(e.target.value)} placeholder="Employee name..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Supervisor</label><input value={assignedSupervisor} onChange={e => setAssignedSupervisor(e.target.value)} placeholder="Supervisor name..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Actions Required</label>
            <div className="grid grid-cols-5 gap-2">
              {actionList.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={actions[key]} onChange={() => toggleAction(key)} className="w-4 h-4 text-indigo-600 rounded" />
                  <span className="text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">Job Description / Line Items</label>
              <button onClick={addLineItem} className="text-xs text-indigo-600 hover:underline font-medium">+ Add Item</button>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50"><tr><th className="px-2 py-2 text-left text-gray-500 font-medium w-6">#</th><th className="px-2 py-2 text-left text-gray-500 font-medium">Description</th><th className="px-2 py-2 text-left text-gray-500 font-medium w-16">Qty</th><th className="px-2 py-2 text-left text-gray-500 font-medium w-20">UOM</th><th className="px-2 py-2 text-left text-gray-500 font-medium">Spec/Notes</th><th className="w-6"></th></tr></thead>
                <tbody>
                  {lineItems.map((item, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-2 py-1.5 text-gray-400">{i + 1}</td>
                      <td className="px-2 py-1.5"><input value={item.description} onChange={e => updateLineItem(i, 'description', e.target.value)} placeholder="Description" className="w-full border-0 focus:outline-none text-xs" /></td>
                      <td className="px-2 py-1.5"><input type="number" value={item.quantity} onChange={e => updateLineItem(i, 'quantity', Number(e.target.value))} min={1} className="w-full border border-gray-200 rounded px-1 py-0.5 text-xs focus:outline-none focus:border-indigo-400" /></td>
                      <td className="px-2 py-1.5"><select value={item.uom} onChange={e => updateLineItem(i, 'uom', e.target.value)} className="w-full border border-gray-200 rounded px-1 py-0.5 text-xs focus:outline-none">{uomOptions.map(u => <option key={u}>{u}</option>)}</select></td>
                      <td className="px-2 py-1.5"><input value={item.notes} onChange={e => updateLineItem(i, 'notes', e.target.value)} placeholder="Notes" className="w-full border-0 focus:outline-none text-xs" /></td>
                      <td className="px-2 py-1.5 text-center">{lineItems.length > 1 && <button onClick={() => removeLineItem(i)} className="text-red-400 hover:text-red-600"><X size={12} /></button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2"><input type="checkbox" id="hasDrawing" checked={hasDrawing} onChange={e => setHasDrawing(e.target.checked)} className="w-4 h-4" /><label htmlFor="hasDrawing" className="text-sm text-gray-700">Drawing Attached / Sketches</label></div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={hasServiceSchedule} onChange={e => setHasServiceSchedule(e.target.checked)} className="w-4 h-4" /><span className="text-gray-700">Service Schedule/QCP</span></label>
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={hasInternalOrder} onChange={e => setHasInternalOrder(e.target.checked)} className="w-4 h-4" /><span className="text-gray-700">Internal Order</span></label>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <label className="block text-xs font-semibold text-amber-800 mb-3">Supervisor Job Planning</label>
            <div className="grid grid-cols-4 gap-3">
              <div><label className="block text-xs text-gray-500 mb-1">Date Received</label><input type="date" value={dateReceived} readOnly className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs bg-gray-50" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Material Ordered</label><input type="date" value={materialOrderedDate} onChange={e => setMaterialOrderedDate(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-400" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Completion Date</label><input type="date" value={completionDate} onChange={e => setCompletionDate(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-400" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Due Date *</label><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-400" /></div>
            </div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Additional notes..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" /></div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleCreate} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
            <Briefcase size={14} />{saving ? 'Creating...' : 'Create Job'}
          </button>
        </div>
      </div>
    </div>
  )
}

