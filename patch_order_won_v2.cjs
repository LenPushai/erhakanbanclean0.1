const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/App.tsx');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');
console.log('Total lines:', lines.length);

// ── 1. Replace job insert block (lines 1261-1268, index 1260-1267) ───────────
// Verify we're at the right spot
const insertLine = lines[1260];
console.log('Line 1261 check:', insertLine.trim().substring(0, 50));

if (!insertLine.includes("supabase.from('jobs').insert({")) {
  console.log('FAIL: Line 1261 is not the jobs insert - file may have shifted');
  console.log('Searching for jobs insert...');
  for (let i = 1200; i < 1350; i++) {
    if (lines[i] && lines[i].includes("supabase.from('jobs').insert({")) {
      console.log('Found at line:', i+1);
    }
  }
  process.exit(1);
}

// Remove lines 1261-1268 (index 1260-1267) = 8 lines
lines.splice(1260, 8,
  "      // 2. Create job record with all RFQ fields",
  "      const { data: jobData, error: jobError } = await supabase.from('jobs').insert({",
  "        rfq_id: rfq.id,",
  "        rfq_no: rfq.rfq_no || null,",
  "        rfq_number: rfq.rfq_no || null,",
  "        enq_number: rfq.enq_number || null,",
  "        client_name: rfq.clients?.company_name || null,",
  "        description: rfq.description,",
  "        po_number: poNumber.trim(),",
  "        order_number: poNumber.trim(),",
  "        status: 'PENDING',",
  "        entry_type: 'RFQ',",
  "        priority: rfq.priority || 'NORMAL',",
  "        site_req: rfq.site_req || null,",
  "        contact_person: rfq.contact_person || null,",
  "        contact_email: rfq.contact_email || null,",
  "        contact_phone: rfq.contact_phone || null,",
  "        due_date: rfq.required_date || null,",
  "        date_received: rfq.request_date || new Date().toISOString().split('T')[0],",
  "        special_requirements: rfq.special_requirements || null,",
  "        notes: rfq.notes || null,",
  "        drawing_number: rfq.drawing_number || null,",
  "        has_drawing: rfq.drawing_number ? true : false,",
  "        is_contract_work: rfq.is_contract_work || false,",
  "        operating_entity: rfq.operating_entity || null,",
  "        is_parent: false,",
  "        is_child_job: false,",
  "      }).select('id').single()"
);
console.log('PASS: Job insert updated with all RFQ fields');

// ── 2. Find and update showMsg line (now shifted) ───────────────────────────
const msgIdx = lines.findIndex(l => l.includes("showMsg('Order won - Job created with line items!')"));
console.log('showMsg line at:', msgIdx + 1);

if (msgIdx === -1) { console.log('FAIL: showMsg not found'); process.exit(1); }

// Insert attachment copy before showMsg
lines.splice(msgIdx, 0,
  "",
  "        // 4. Copy attachments from RFQ to job",
  "        const { data: rfqAttachments } = await supabase",
  "          .from('rfq_attachments')",
  "          .select('*')",
  "          .eq('rfq_id', rfq.id)",
  "",
  "        if (rfqAttachments && rfqAttachments.length > 0) {",
  "          const jobAttachments = rfqAttachments.map((att: any) => ({",
  "            job_id: jobData.id,",
  "            rfq_attachment_id: att.id,",
  "            file_name: att.file_name,",
  "            file_path: att.file_path,",
  "            file_size: att.file_size || null,",
  "            file_type: att.file_type || null,",
  "            uploaded_by: att.uploaded_by || null,",
  "          }))",
  "          const { error: attError } = await supabase.from('job_attachments').insert(jobAttachments)",
  "          if (attError) console.error('Attachment copy error:', attError.message)",
  "          else console.log('Copied', jobAttachments.length, 'attachments to job')",
  "        }",
  ""
);
console.log('PASS: Attachment copy added before showMsg');

// Update the showMsg text
const msgIdx2 = lines.findIndex(l => l.includes("showMsg('Order won - Job created with line items!')"));
lines[msgIdx2] = "        showMsg('Order won! Job created with all RFQ details, line items & attachments.')";
console.log('PASS: showMsg text updated');

// ── 3. Add attachments section to JobDetailPanel UI ─────────────────────────
// Find the Notes label in JobDetailPanel
const notesIdx = lines.findIndex(l => l.includes("block text-xs font-medium text-gray-500 mb-1") && l.includes('Notes'));
console.log('Notes label at:', notesIdx + 1);

if (notesIdx === -1) { console.log('FAIL: Notes label not found'); }
else {
  // Insert attachments section before notes div
  const notesDivIdx = notesIdx - 1; // the <div> before the label
  lines.splice(notesDivIdx, 0,
    "        {attachments.length > 0 && (",
    "          <div>",
    "            <label className=\"block text-xs font-medium text-gray-500 mb-2\">Attachments</label>",
    "            <div className=\"space-y-1\">",
    "              {attachments.map((att: any) => (",
    "                <a key={att.id} href={att.file_path} target=\"_blank\" rel=\"noopener noreferrer\"",
    "                  className=\"flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs text-blue-700 transition-colors\">",
    "                  <span>📎</span>",
    "                  <span className=\"flex-1 truncate\">{att.file_name}</span>",
    "                  {att.file_size && <span className=\"text-gray-400\">{(att.file_size/1024).toFixed(0)}KB</span>}",
    "                </a>",
    "              ))}",
    "            </div>",
    "          </div>",
    "        )}"
  );
  console.log('PASS: Attachments UI section added');
}

// ── Write ────────────────────────────────────────────────────────────────────
fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
const out = fs.readFileSync(filePath, 'utf8');
console.log('');
console.log('Final lines:', out.split('\n').length);
console.log(out.includes('rfq_no: rfq.rfq_no') ? 'PASS: rfq_no in insert' : 'FAIL: rfq_no missing');
console.log(out.includes('rfq_attachments') ? 'PASS: attachment copy in file' : 'FAIL: attachment copy missing');
console.log(out.includes('job_attachments') ? 'PASS: job_attachments in file' : 'FAIL: job_attachments missing');
console.log('');
console.log('ALL DONE - run: npx vite --force');
