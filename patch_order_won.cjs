const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/App.tsx');
let content = fs.readFileSync(filePath, 'utf8');
let pass = 0; let fail = 0;

function check(name, ok) {
  console.log((ok ? 'PASS' : 'FAIL') + ': ' + name);
  if (ok) pass++; else fail++;
}

// ── 1. Replace the thin job insert with a comprehensive one ─────────────────
const oldInsert = `      // 2. Create job record
      const { data: jobData, error: jobError } = await supabase.from('jobs').insert({
        rfq_id: rfq.id,
        client_name: rfq.clients?.company_name || null,
        description: rfq.description,
        po_number: poNumber.trim(),
        status: 'PENDING',
        priority: rfq.priority || 'NORMAL',
      }).select('id').single()`;

const newInsert = `      // 2. Create job record with all RFQ fields
      const { data: jobData, error: jobError } = await supabase.from('jobs').insert({
        rfq_id: rfq.id,
        rfq_no: rfq.rfq_no || null,
        rfq_number: rfq.rfq_no || null,
        enq_number: rfq.enq_number || null,
        client_name: rfq.clients?.company_name || null,
        description: rfq.description,
        po_number: poNumber.trim(),
        order_number: poNumber.trim(),
        status: 'PENDING',
        entry_type: 'RFQ',
        priority: rfq.priority || 'NORMAL',
        site_req: rfq.site_req || null,
        contact_person: rfq.contact_person || null,
        contact_email: rfq.contact_email || null,
        contact_phone: rfq.contact_phone || null,
        due_date: rfq.required_date || null,
        date_received: rfq.request_date || new Date().toISOString().split('T')[0],
        special_requirements: rfq.special_requirements || null,
        notes: rfq.notes || null,
        drawing_number: rfq.drawing_number || null,
        has_drawing: rfq.drawing_number ? true : false,
        is_contract_work: rfq.is_contract_work || false,
        operating_entity: rfq.operating_entity || null,
        is_parent: false,
        is_child_job: false,
      }).select('id').single()`;

if (content.includes(oldInsert)) {
  content = content.replace(oldInsert, newInsert);
  check('Order Won job insert updated with all RFQ fields', true);
} else { check('Order Won job insert updated with all RFQ fields', false); }

// ── 2. Add attachment copying after line items copy ─────────────────────────
const oldMsg = `        showMsg('Order won - Job created with line items!')
        if (onJobCreated) onJobCreated()`;

const newMsg = `        // 4. Copy attachments from RFQ to job
        const { data: rfqAttachments } = await supabase
          .from('rfq_attachments')
          .select('*')
          .eq('rfq_id', rfq.id)

        if (rfqAttachments && rfqAttachments.length > 0) {
          const jobAttachments = rfqAttachments.map(att => ({
            job_id: jobData.id,
            rfq_attachment_id: att.id,
            file_name: att.file_name,
            file_path: att.file_path,
            file_size: att.file_size || null,
            file_type: att.file_type || null,
            uploaded_by: att.uploaded_by || null,
          }))
          const { error: attError } = await supabase.from('job_attachments').insert(jobAttachments)
          if (attError) console.error('Attachment copy error:', attError.message)
          else console.log('Copied', jobAttachments.length, 'attachments to job')
        }

        showMsg('Order won - Job created with line items & attachments!')
        if (onJobCreated) onJobCreated()`;

if (content.includes(oldMsg)) {
  content = content.replace(oldMsg, newMsg);
  check('Attachment copying added to Order Won', true);
} else { check('Attachment copying added to Order Won', false); }

// ── 3. Show attachments in JobDetailPanel ───────────────────────────────────
// Add job_attachments state + fetch after lineItems state
const oldAttState = `  const [lineItems, setLineItems] = React.useState<any[]>([])`;
const newAttState = `  const [lineItems, setLineItems] = React.useState<any[]>([])
  const [attachments, setAttachments] = React.useState<any[]>([])`;

if (!content.includes("const [attachments, setAttachments]") && content.includes(oldAttState)) {
  content = content.replace(oldAttState, newAttState);
  check('Attachments state added to JobDetailPanel', true);
} else { check('Attachments state added (or already exists)', true); }

// ── 4. Fetch attachments alongside line items ────────────────────────────────
const oldFetchEnd = `    supabase.from('job_line_items')
      .select('*, child_job:jobs!child_job_id(job_number)')
      .eq('job_id', job.id)
      .order('sort_order')
      .then(({ data }) => {
        if (data) setLineItems(data.map((li: any) => ({
          ...li,
          child_job_number: li.child_job?.job_number || null
        })))
      })`;

const newFetchEnd = `    supabase.from('job_line_items')
      .select('*, child_job:jobs!child_job_id(job_number)')
      .eq('job_id', job.id)
      .order('sort_order')
      .then(({ data }) => {
        if (data) setLineItems(data.map((li: any) => ({
          ...li,
          child_job_number: li.child_job?.job_number || null
        })))
      })
    supabase.from('job_attachments')
      .select('*')
      .eq('job_id', job.id)
      .order('created_at')
      .then(({ data }) => { if (data) setAttachments(data) })`;

if (content.includes(oldFetchEnd)) {
  content = content.replace(oldFetchEnd, newFetchEnd);
  check('Attachments fetch added to JobDetailPanel', true);
} else { check('Attachments fetch added', false); }

// ── 5. Show attachments section in JobDetailPanel UI ────────────────────────
const oldNotesSection = `        <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
            <textarea`;

const newNotesSection = `        {attachments.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Attachments from RFQ</label>
            <div className="space-y-1">
              {attachments.map(att => (
                <a key={att.id} href={att.file_path} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs text-blue-700 transition-colors">
                  <span>📎</span>
                  <span className="flex-1 truncate">{att.file_name}</span>
                  {att.file_size && <span className="text-gray-400">{(att.file_size/1024).toFixed(0)}KB</span>}
                </a>
              ))}
            </div>
          </div>
        )}
        <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
            <textarea`;

if (content.includes(oldNotesSection)) {
  content = content.replace(oldNotesSection, newNotesSection);
  check('Attachments section added to JobDetailPanel UI', true);
} else { check('Attachments section added to UI', false); }

// ── Write ────────────────────────────────────────────────────────────────────
fs.writeFileSync(filePath, content, 'utf8');
const out = fs.readFileSync(filePath, 'utf8');
console.log('');
console.log('Total lines:', out.split('\n').length);
console.log('PASS:', pass, '| FAIL:', fail);
if (fail === 0) console.log('ALL PASS - run: npx vite --force');
else console.log('Fix FAILs before running Vite');
