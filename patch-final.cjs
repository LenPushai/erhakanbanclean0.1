const fs = require('fs')
const f = 'C:\\Users\\lenkl\\WebstormProjects\\erhakanbanclean0.1\\src\\App.tsx'
fs.copyFileSync(f, f + '.bak13')

let lines = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n').split('\n')

// Find start and end of the lineItems block using bracket depth counting
let blockStart = -1
let blockEnd = -1
let depth = 0

for (let i = 0; i < lines.length; i++) {
  if (blockStart === -1 && lines[i].includes('{lineItems.length > 0 && (')) {
    blockStart = i
    depth = 1
    continue
  }
  if (blockStart !== -1) {
    for (const ch of lines[i]) {
      if (ch === '(') depth++
      if (ch === ')') depth--
    }
    if (depth === 0) {
      blockEnd = i
      break
    }
  }
}

console.log('Block found: lines', blockStart+1, 'to', blockEnd+1)

if (blockStart === -1 || blockEnd === -1) {
  console.error('Block not found - check file')
  process.exit(1)
}

const newBlock = [
  '        <>',
  '          <div className="flex items-center justify-between mb-2">',
  '            <label className="block text-xs font-medium text-gray-500">Line Items</label>',
  '            <div className="flex items-center gap-2">',
  '              <span className="text-xs text-gray-400">Spawn creates a child job</span>',
  '              <button onClick={addNewLine} className="text-xs font-semibold text-green-600 bg-green-50 hover:bg-green-100 px-2 py-0.5 rounded">+ Add Line</button>',
  '            </div>',
  '          </div>',
  '          {lineItems.length > 0 && (',
  '            <div className="border border-gray-200 rounded-lg overflow-hidden">',
  '              <table className="w-full text-xs">',
  '                <thead className="bg-gray-50"><tr>',
  '                  <th className="px-3 py-2 text-left text-gray-500 font-medium">#</th>',
  '                  <th className="px-3 py-2 text-left text-gray-500 font-medium">Description</th>',
  '                  <th className="px-3 py-2 text-left text-gray-500 font-medium w-14">Qty</th>',
  '                  <th className="px-3 py-2 text-left text-gray-500 font-medium w-16">UOM</th>',
  '                  <th className="px-3 py-2 text-left text-gray-500 font-medium w-24">Child Job</th>',
  '                </tr></thead>',
  '                <tbody>',
  '                  {lineItems.map((item, i) => (',
  '                    <tr key={item.id} className="border-t border-gray-100">',
  '                      <td className="px-3 py-2 text-gray-400">{i + 1}</td>',
  '                      <td className="px-3 py-2 text-gray-800">{item.description}</td>',
  '                      <td className="px-3 py-2 text-gray-600">{item.quantity}</td>',
  '                      <td className="px-3 py-2 text-gray-600">{item.uom}</td>',
  '                      <td className="px-3 py-2">',
  '                        {item.child_job_id ? (',
  '                          <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">',
  "                            {item.child_job_number || 'Spawned'}",
  '                          </span>',
  '                        ) : (',
  '                          <button onClick={() => setSpawnTarget(item)} disabled={spawning === item.id} className="px-2 py-0.5 text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 rounded transition-colors">',
  "                            {spawning === item.id ? '...' : 'Spawn'}",
  '                          </button>',
  '                        )}',
  '                      </td>',
  '                    </tr>',
  '                  ))}',
  '                </tbody>',
  '              </table>',
  '            </div>',
  '          )}',
  '          {newLineItems.length > 0 && (',
  '            <div className="mt-3 border border-green-200 rounded-lg overflow-hidden">',
  '              <div className="bg-green-50 px-3 py-1.5 flex items-center justify-between">',
  '                <span className="text-xs font-medium text-green-700">New Line Items</span>',
  "                <button onClick={saveNewLines} disabled={savingLines} className=\"text-xs font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 px-3 py-0.5 rounded\">{savingLines ? 'Saving...' : 'Save Lines'}</button>",
  '              </div>',
  '              <table className="w-full text-xs">',
  '                <thead className="bg-gray-50"><tr>',
  '                  <th className="px-2 py-1.5 text-left text-gray-500 font-medium w-24">Type</th>',
  '                  <th className="px-2 py-1.5 text-left text-gray-500 font-medium">Description</th>',
  '                  <th className="px-2 py-1.5 text-left text-gray-500 font-medium w-12">Qty</th>',
  '                  <th className="px-2 py-1.5 text-left text-gray-500 font-medium w-14">UOM</th>',
  '                  <th className="w-6"></th>',
  '                </tr></thead>',
  '                <tbody>',
  '                  {newLineItems.map((item,i) => (',
  '                    <tr key={i} className="border-t border-gray-100">',
  "                      <td className=\"px-2 py-1\"><select value={item.item_type} onChange={e=>updateNewLine(i,'item_type',e.target.value)} className=\"border border-gray-200 rounded px-1 py-0.5 text-xs w-full\">{['MATERIAL','LABOUR','SUBCONTRACT','EQUIPMENT','OTHER'].map(t=><option key={t}>{t}</option>)}</select></td>",
  '                      <td className="px-2 py-1"><input value={item.description} onChange={e=>updateNewLine(i,\'description\',e.target.value)} placeholder="Description..." className="border border-gray-200 rounded px-1 py-0.5 text-xs w-full"/></td>',
  '                      <td className="px-2 py-1"><input type="number" min={1} value={item.quantity} onChange={e=>updateNewLine(i,\'quantity\',Number(e.target.value))} className="border border-gray-200 rounded px-1 py-0.5 text-xs w-full"/></td>',
  "                      <td className=\"px-2 py-1\"><select value={item.uom} onChange={e=>updateNewLine(i,'uom',e.target.value)} className=\"border border-gray-200 rounded px-1 py-0.5 text-xs w-full\">{['EA','M','KG','L','HR','SET','M2','M3','TON'].map(u=><option key={u}>{u}</option>)}</select></td>",
  '                      <td className="px-2 py-1 text-center"><button onClick={()=>removeNewLine(i)} className="text-red-400 hover:text-red-600"><X size={12}/></button></td>',
  '                    </tr>',
  '                  ))}',
  '                </tbody>',
  '              </table>',
  '            </div>',
  '          )}',
  '          {lineItems.length === 0 && newLineItems.length === 0 && (',
  '            <div className="text-center py-4 border border-dashed border-gray-200 rounded-lg">',
  '              <p className="text-xs text-gray-400 mb-1">No line items yet</p>',
  '              <button onClick={addNewLine} className="text-xs font-semibold text-green-600 hover:underline">+ Add first line item</button>',
  '            </div>',
  '          )}',
  '        </>'
]

// Add state helpers after attachments state
let stateInserted = false
for (let i = 0; i < lines.length; i++) {
  if (!stateInserted && lines[i].includes('const [attachments, setAttachments] = React.useState')) {
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
    stateInserted = true
    console.log('State helpers inserted at line', i+2)
    // Recalculate blockStart/blockEnd since we inserted lines
    blockStart += 20
    blockEnd += 20
    break
  }
}

// Replace the block atomically
lines.splice(blockStart, blockEnd - blockStart + 1, ...newBlock)
console.log('Block replaced: lines', blockStart+1, 'to', blockEnd+1, '-> fragment with', newBlock.length, 'lines')

// Write back with Windows CRLF
fs.writeFileSync(f, lines.join('\n').replace(/\n/g, '\r\n'), 'utf8')
console.log('Done. Run: npm run dev')
