const fs = require('fs')
const f = 'C:\\Users\\lenkl\\WebstormProjects\\erhakanbanclean0.1\\src\\App.tsx'
const src = fs.readFileSync(f, 'utf8')
const lines = src.split('\n')

// B: Add state after attachments state
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const [attachments, setAttachments] = React.useState<any[]>([])') && !lines[i+1]?.includes('newLineItems')) {
    lines.splice(i+1, 0,
      `  const [newLineItems, setNewLineItems] = React.useState([])`,
      `  const [savingLines, setSavingLines] = React.useState(false)`,
      `  const addNewLine = () => setNewLineItems(p => [...p, {description:'',quantity:1,uom:'EA',item_type:'MATERIAL'}])`,
      `  const removeNewLine = (i) => setNewLineItems(p => p.filter((_,idx)=>idx!==i))`,
      `  const updateNewLine = (i,field,val) => setNewLineItems(p => p.map((x,idx)=>idx===i?{...x,[field]:val}:x))`,
      `  const saveNewLines = async () => {`,
      `    const valid = newLineItems.filter(l => l.description.trim())`,
      `    if (!valid.length) return`,
      `    setSavingLines(true)`,
      `    try {`,
      `      const { data: ex } = await supabase.from('job_line_items').select('sort_order').eq('job_id', job.id).order('sort_order',{ascending:false}).limit(1)`,
      `      const next = ((ex?.[0]?.sort_order)||0)+1`,
      `      await supabase.from('job_line_items').insert(valid.map((x,idx)=>({job_id:job.id,description:x.description.trim(),quantity:x.quantity,uom:x.uom,item_type:x.item_type,cost_price:0,sell_price:0,line_total:0,status:'PENDING',sort_order:next+idx,can_spawn_job:true})))`,
      `      const {data:r} = await supabase.from('job_line_items').select('*, child_job:jobs!child_job_id(job_number)').eq('job_id',job.id).order('sort_order')`,
      `      if (r) setLineItems(r.map((li)=>({...li,child_job_number:li.child_job?.job_number||null})))`,
      `      setNewLineItems([])`,
      `      showMsg('Line items saved')`,
      `    } catch(err){ showMsg('Error: '+err.message) }`,
      `    finally{ setSavingLines(false) }`,
      `  }`
    )
    console.log('[B] State + saveNewLines inserted at line', i+2)
    break
  }
}

// C+D: Insert new line items block after the )} that closes lineItems, before attachments
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === ')}' && lines[i+1]?.includes('attachments.length > 0')) {
    lines.splice(i+1, 0,
      `          {newLineItems.length > 0 && (`,
      `            <div className="mt-3 border border-green-200 rounded-lg overflow-hidden">`,
      `              <div className="bg-green-50 px-3 py-1.5 flex items-center justify-between">`,
      `                <span className="text-xs font-medium text-green-700">New Line Items</span>`,
      `                <button onClick={saveNewLines} disabled={savingLines} className="text-xs font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 px-3 py-0.5 rounded">{savingLines ? 'Saving...' : 'Save Lines'}</button>`,
      `              </div>`,
      `              <table className="w-full text-xs">`,
      `                <thead className="bg-gray-50"><tr>`,
      `                  <th className="px-2 py-1.5 text-left text-gray-500 font-medium w-24">Type</th>`,
      `                  <th className="px-2 py-1.5 text-left text-gray-500 font-medium">Description</th>`,
      `                  <th className="px-2 py-1.5 text-left text-gray-500 font-medium w-12">Qty</th>`,
      `                  <th className="px-2 py-1.5 text-left text-gray-500 font-medium w-14">UOM</th>`,
      `                  <th className="w-6"></th>`,
      `                </tr></thead>`,
      `                <tbody>`,
      `                  {newLineItems.map((item,i) => (`,
      `                    <tr key={i} className="border-t border-gray-100">`,
      `                      <td className="px-2 py-1"><select value={item.item_type} onChange={e=>updateNewLine(i,'item_type',e.target.value)} className="border border-gray-200 rounded px-1 py-0.5 text-xs w-full">{['MATERIAL','LABOUR','SUBCONTRACT','EQUIPMENT','OTHER'].map(t=><option key={t}>{t}</option>)}</select></td>`,
      `                      <td className="px-2 py-1"><input value={item.description} onChange={e=>updateNewLine(i,'description',e.target.value)} placeholder="Description..." className="border border-gray-200 rounded px-1 py-0.5 text-xs w-full"/></td>`,
      `                      <td className="px-2 py-1"><input type="number" min={1} value={item.quantity} onChange={e=>updateNewLine(i,'quantity',Number(e.target.value))} className="border border-gray-200 rounded px-1 py-0.5 text-xs w-full"/></td>`,
      `                      <td className="px-2 py-1"><select value={item.uom} onChange={e=>updateNewLine(i,'uom',e.target.value)} className="border border-gray-200 rounded px-1 py-0.5 text-xs w-full">{['EA','M','KG','L','HR','SET','M2','M3','TON'].map(u=><option key={u}>{u}</option>)}</select></td>`,
      `                      <td className="px-2 py-1 text-center"><button onClick={()=>removeNewLine(i)} className="text-red-400 hover:text-red-600"><X size={12}/></button></td>`,
      `                    </tr>`,
      `                  ))}`,
      `                </tbody>`,
      `              </table>`,
      `            </div>`,
      `          )}`,
      `          {lineItems.length === 0 && newLineItems.length === 0 && (`,
      `            <div className="text-center py-4 border border-dashed border-gray-200 rounded-lg">`,
      `              <p className="text-xs text-gray-400 mb-1">No line items yet</p>`,
      `              <button onClick={addNewLine} className="text-xs font-semibold text-green-600 hover:underline">+ Add first line item</button>`,
      `            </div>`,
      `          )}`,
      `        </div>`
    )
    console.log('[C] New line items block inserted at line', i+2)
    break
  }
}

// E: Add + Add Line button to header
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Click Spawn to create a child job from a line item')) {
    lines[i] = `              <span className="text-xs text-gray-400">Spawn creates a child job</span>`
    lines.splice(i+1, 0, `              <button onClick={addNewLine} className="text-xs font-semibold text-green-600 bg-green-50 hover:bg-green-100 px-2 py-0.5 rounded">+ Add Line</button>`)
    console.log('[E] + Add Line button inserted at line', i+2)
    break
  }
}

fs.writeFileSync(f, lines.join('\n'), 'utf8')
console.log('\nAll done. Run: npm run dev')