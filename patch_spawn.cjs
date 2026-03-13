const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/App.tsx');
let content = fs.readFileSync(filePath, 'utf8');
let pass = 0; let fail = 0;

function check(name, ok) {
  console.log((ok ? 'PASS' : 'FAIL') + ': ' + name);
  if (ok) pass++; else fail++;
}

// ── 1. Add 'CHILD' to status constraint reminder (SQL only - no code change needed)
// ── 2. Replace JobDetailPanel line items section with spawn buttons ───────────

const oldLineItems = `        {lineItems.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Line Items</label>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50"><tr>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">#</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">Description</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium w-14">Qty</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium w-16">UOM</th>
                </tr></thead>
                <tbody>
                  {lineItems.map((item, i) => (
                    <tr key={item.id} className="border-t border-gray-100">
                      <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                      <td className="px-3 py-2 text-gray-800">{item.description}</td>
                      <td className="px-3 py-2 text-gray-600">{item.quantity}</td>
                      <td className="px-3 py-2 text-gray-600">{item.uom}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}`;

const newLineItems = `        {lineItems.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-gray-500">Line Items</label>
              <span className="text-xs text-gray-400">Click Spawn to create a child job from a line item</span>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50"><tr>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">#</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">Description</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium w-14">Qty</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium w-16">UOM</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium w-24">Child Job</th>
                </tr></thead>
                <tbody>
                  {lineItems.map((item, i) => (
                    <tr key={item.id} className="border-t border-gray-100">
                      <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                      <td className="px-3 py-2 text-gray-800">{item.description}</td>
                      <td className="px-3 py-2 text-gray-600">{item.quantity}</td>
                      <td className="px-3 py-2 text-gray-600">{item.uom}</td>
                      <td className="px-3 py-2">
                        {item.child_job_id ? (
                          <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                            {item.child_job_number || 'Spawned'}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSpawnJob(item)}
                            disabled={spawning === item.id}
                            className="px-2 py-0.5 text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 rounded transition-colors"
                          >
                            {spawning === item.id ? '...' : 'Spawn'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}`;

if (content.includes(oldLineItems)) {
  content = content.replace(oldLineItems, newLineItems);
  check('Line items table with spawn buttons', true);
} else { check('Line items table with spawn buttons', false); }

// ── 3. Add spawning state + handleSpawnJob after existing state declarations ─
const oldSpawning = `  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }`;
const newSpawning = `  const [spawning, setSpawning] = React.useState<string | null>(null)

  const handleSpawnJob = async (lineItem: any) => {
    setSpawning(lineItem.id)
    try {
      // 1. Create child job inheriting parent fields
      const { data: childJob, error: jobError } = await supabase.from('jobs').insert({
        parent_job_id: job.id,
        is_child_job: true,
        is_parent: false,
        description: lineItem.description,
        client_name: job.client_name,
        site_req: job.site_req || null,
        due_date: job.due_date || null,
        priority: job.priority || 'NORMAL',
        entry_type: 'CHILD',
        status: 'PENDING',
        rfq_no: job.rfq_no || null,
        notes: 'Spawned from ' + (job.job_number || 'parent job') + ' - Line item: ' + lineItem.description,
        compiled_by: job.compiled_by || null,
        date_received: new Date().toISOString().split('T')[0],
      }).select().single()
      if (jobError) throw jobError

      // 2. Update line item with child_job_id
      const { error: liError } = await supabase.from('job_line_items')
        .update({ child_job_id: childJob.id })
        .eq('id', lineItem.id)
      if (liError) throw liError

      // 3. Mark parent as is_parent
      await supabase.from('jobs').update({ is_parent: true }).eq('id', job.id)

      // 4. Refresh line items with child job numbers
      const { data: updatedItems } = await supabase
        .from('job_line_items')
        .select('*, child_job:jobs!child_job_id(job_number)')
        .eq('job_id', job.id)
        .order('sort_order')
      if (updatedItems) {
        setLineItems(updatedItems.map((li: any) => ({
          ...li,
          child_job_number: li.child_job?.job_number || null
        })))
      }

      showMsg('Child job ' + (childJob.job_number || '') + ' created successfully')
      onUpdate({ ...job, is_parent: true })
    } catch (err: any) {
      showMsg('Error spawning job: ' + err.message)
    } finally { setSpawning(null) }
  }

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }`;

if (!content.includes('handleSpawnJob')) {
  if (content.includes(oldSpawning)) {
    content = content.replace(oldSpawning, newSpawning);
    check('handleSpawnJob + spawning state added', true);
  } else { check('handleSpawnJob + spawning state added', false); }
} else { check('handleSpawnJob already exists', true); }

// ── 4. Update line items fetch to include child job number ───────────────────
const oldFetch = `    supabase.from('job_line_items').select('*').eq('job_id', job.id).order('sort_order').then(({ data }) => {
      if (data) setLineItems(data)
    })`;
const newFetch = `    supabase.from('job_line_items')
      .select('*, child_job:jobs!child_job_id(job_number)')
      .eq('job_id', job.id)
      .order('sort_order')
      .then(({ data }) => {
        if (data) setLineItems(data.map((li: any) => ({
          ...li,
          child_job_number: li.child_job?.job_number || null
        })))
      })`;

if (content.includes(oldFetch)) {
  content = content.replace(oldFetch, newFetch);
  check('Line items fetch updated with child job number', true);
} else { check('Line items fetch updated', false); }

// ── 5. Add parent badge to job detail panel header ───────────────────────────
const oldBadge = `            {job.entry_type === 'DIRECT' && <span className="text-xs font-bold px-2 py-0.5 bg-orange-400 text-white rounded">DIRECT</span>}
            {job.is_emergency && <span className="text-xs font-bold px-2 py-0.5 bg-red-500 text-white rounded">EMERGENCY</span>}`;
const newBadge = `            {job.entry_type === 'DIRECT' && <span className="text-xs font-bold px-2 py-0.5 bg-orange-400 text-white rounded">DIRECT</span>}
            {job.entry_type === 'CHILD' && <span className="text-xs font-bold px-2 py-0.5 bg-indigo-400 text-white rounded">CHILD JOB</span>}
            {job.is_parent && <span className="text-xs font-bold px-2 py-0.5 bg-purple-500 text-white rounded">PARENT</span>}
            {job.is_emergency && <span className="text-xs font-bold px-2 py-0.5 bg-red-500 text-white rounded">EMERGENCY</span>}`;

if (content.includes(oldBadge)) {
  content = content.replace(oldBadge, newBadge);
  check('Parent/Child badges added to detail panel', true);
} else { check('Parent/Child badges added', false); }

// ── 6. Add parent job reference in info grid ─────────────────────────────────
const oldInfo = `          {job.created_at && <div><span className="text-xs text-gray-500 block">Created</span><span className="font-medium">{new Date(job.created_at).toLocaleDateString('en-ZA')}</span></div>}`;
const newInfo = `          {job.created_at && <div><span className="text-xs text-gray-500 block">Created</span><span className="font-medium">{new Date(job.created_at).toLocaleDateString('en-ZA')}</span></div>}
          {job.parent_job_id && <div><span className="text-xs text-gray-500 block">Parent Job</span><span className="font-medium text-purple-600">{job.rfq_no || job.parent_job_id.slice(0,8)}</span></div>}`;

if (content.includes(oldInfo)) {
  content = content.replace(oldInfo, newInfo);
  check('Parent job reference in info grid', true);
} else { check('Parent job reference in info grid', false); }

// ── 7. Add CHILD to kanban card badges ───────────────────────────────────────
const oldCardBadge = `                        {job.entry_type === 'DIRECT' && <span className="text-xs font-bold px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded">DIRECT</span>}
                        {job.is_emergency && <span className="text-xs font-bold px-1.5 py-0.5 bg-red-100 text-red-600 rounded">!</span>}`;
const newCardBadge = `                        {job.entry_type === 'DIRECT' && <span className="text-xs font-bold px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded">DIRECT</span>}
                        {job.entry_type === 'CHILD' && <span className="text-xs font-bold px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded">↳</span>}
                        {job.is_parent && <span className="text-xs font-bold px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded">P</span>}
                        {job.is_emergency && <span className="text-xs font-bold px-1.5 py-0.5 bg-red-100 text-red-600 rounded">!</span>}`;

if (content.includes(oldCardBadge)) {
  content = content.replace(oldCardBadge, newCardBadge);
  check('Child/Parent badges on Kanban card', true);
} else { check('Child/Parent badges on Kanban card', false); }

// ── Write ────────────────────────────────────────────────────────────────────
fs.writeFileSync(filePath, content, 'utf8');
const out = fs.readFileSync(filePath, 'utf8');
console.log('');
console.log('Total lines:', out.split('\n').length);
console.log('PASS:', pass, '| FAIL:', fail);
if (fail === 0) console.log('ALL PASS - run: npx vite --force');
else console.log('Fix FAILs before running Vite');
console.log('');
console.log('IMPORTANT: Run this SQL in Supabase first:');
console.log("ALTER TABLE jobs DROP CONSTRAINT jobs_status_check;");
console.log("ALTER TABLE jobs ADD CONSTRAINT jobs_status_check CHECK (status IN ('PENDING','IN_REVIEW','READY_TO_PRINT','PRINTED','SCHEDULED','IN_PROGRESS','ON_HOLD','QUALITY_CHECK','COMPLETE','NEW','ACTIVE','CANCELLED','CLOSED','JOB_CREATED','CHILD'));");
