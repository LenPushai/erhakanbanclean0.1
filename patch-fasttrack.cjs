const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');
const crlf = c.includes('\r\n');
const nl = crlf ? '\r\n' : '\n';
let changes = 0;

// 1. Add the Fast Track button after the "Send Quote to Customer" button (visible on NEW, PENDING, QUOTED, SENT_TO_CUSTOMER)
const marker = `{status === 'QUOTED' && (` + nl + `          <button onClick={async () => {`;

const fastTrackBlock = `{(status === 'NEW' || status === 'PENDING' || status === 'QUOTED' || status === 'SENT_TO_CUSTOMER') && (` + nl +
`          <button onClick={async () => {` + nl +
`            if (!confirm('FAST TRACK: This will create a Job Card immediately without waiting for a PO number. The PO can be added later. Continue?')) return` + nl +
`            setSaving(true)` + nl +
`            try {` + nl +
`              const year = new Date().getFullYear().toString().slice(-2)` + nl +
`              const { count: jobCount } = await supabase.from('jobs').select('*', { count: 'exact', head: true })` + nl +
`              const seq = String((jobCount || 0) + 1).padStart(3, '0')` + nl +
`              const newJobNumber = 'JOB-' + year + '-' + seq` + nl +
`              const pendingPO = 'PENDING-' + new Date().toISOString().slice(0,10)` + nl +
`              const { data: jobData, error: jobError } = await supabase.from('jobs').insert({` + nl +
`                job_number: newJobNumber,` + nl +
`                rfq_id: rfq.id,` + nl +
`                rfq_no: rfq.rfq_no || null,` + nl +
`                enq_number: rfq.enq_number || null,` + nl +
`                client_name: rfq.clients?.company_name || (rfq as any).client_name || 'Unknown Client',` + nl +
`                description: rfq.description,` + nl +
`                po_number: pendingPO,` + nl +
`                order_number: pendingPO,` + nl +
`                status: 'PENDING',` + nl +
`                entry_type: 'FAST_TRACK',` + nl +
`                priority: rfq.priority || 'URGENT',` + nl +
`                site_req: rfq.site_req || null,` + nl +
`                contact_person: rfq.contact_person || null,` + nl +
`                contact_email: rfq.contact_email || null,` + nl +
`                contact_phone: rfq.contact_phone || null,` + nl +
`                due_date: rfq.required_date || null,` + nl +
`                date_received: rfq.request_date || new Date().toISOString().split('T')[0],` + nl +
`                special_requirements: rfq.special_requirements || null,` + nl +
`                notes: 'FAST TRACKED - PO pending. Created from ' + (rfq.rfq_no || 'RFQ') + ' on ' + new Date().toLocaleDateString('en-ZA'),` + nl +
`                drawing_number: rfq.drawing_number || null,` + nl +
`                has_drawing: rfq.drawing_number ? true : false,` + nl +
`                client_rfq_number: rfq.client_rfq_number || null,` + nl +
`                is_contract_work: rfq.is_contract_work || false,` + nl +
`                is_parent: false,` + nl +
`                is_child_job: false,` + nl +
`              }).select('id').single()` + nl +
`              if (jobError) throw jobError` + nl +
`              // Copy line items` + nl +
`              const { data: rfqItems } = await supabase.from('rfq_line_items').select('*').eq('rfq_id', rfq.id).order('line_number')` + nl +
`              if (rfqItems && rfqItems.length > 0) {` + nl +
`                await supabase.from('job_line_items').insert(rfqItems.map((item, idx) => ({ job_id: jobData.id, description: item.description, quantity: item.quantity || 1, uom: item.unit_of_measure || 'EA', item_type: item.item_type || 'MATERIAL', cost_price: 0, sell_price: 0, line_total: 0, status: 'PENDING', sort_order: idx, can_spawn_job: true })))` + nl +
`              }` + nl +
`              if (onJobCreated) onJobCreated()` + nl +
`              showMsg('⚡ Fast Track: Job ' + newJobNumber + ' created! PO pending.')` + nl +
`            } catch (err) { alert('Error: ' + (err as any).message) }` + nl +
`            finally { setSaving(false) }` + nl +
`          }} disabled={saving} className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 mb-2">` + nl +
`            {saving ? 'Creating...' : '⚡ Fast Track → Create Job (No PO Required)'}` + nl +
`          </button>` + nl +
`        )}` + nl + nl +
`        {status === 'QUOTED' && (` + nl +
`          <button onClick={async () => {`;

if (c.includes(marker)) {
  c = c.replace(marker, fastTrackBlock);
  changes++;
  console.log('1. Fast Track button: PATCHED');
} else {
  console.log('1. Fast Track button: FAILED');
}

// 2. Add FAST_TRACK badge to Job Board cards
const oldBadge = `{job.entry_type === 'IMPORT' && <span className="text-xs font-bold px-1.5 py-0.5 bg-teal-100 text-teal-600 rounded">IMPORT</span>}`;
const newBadge = oldBadge + nl + `                        {job.entry_type === 'FAST_TRACK' && <span className="text-xs font-bold px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded">⚡ FAST</span>}`;
if (c.includes(oldBadge)) {
  c = c.replace(oldBadge, newBadge);
  changes++;
  console.log('2. FAST_TRACK badge on Job Board: PATCHED');
} else {
  console.log('2. FAST_TRACK badge: FAILED');
}

// 3. Add FAST_TRACK badge to Job Detail Panel header
const oldDetailBadge = `{job.entry_type === 'CHILD' && <span className="text-xs font-bold px-2 py-0.5 bg-indigo-400 text-white rounded">CHILD JOB</span>}`;
const newDetailBadge = oldDetailBadge + nl + `            {job.entry_type === 'FAST_TRACK' && <span className="text-xs font-bold px-2 py-0.5 bg-amber-400 text-white rounded">⚡ FAST TRACK</span>}`;
if (c.includes(oldDetailBadge)) {
  c = c.replace(oldDetailBadge, newDetailBadge);
  changes++;
  console.log('3. FAST_TRACK badge on Detail Panel: PATCHED');
} else {
  console.log('3. Detail badge: FAILED');
}

fs.writeFileSync('src/App.tsx', c, 'utf8');
console.log('\nTotal patches:', changes);