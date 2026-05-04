// patch_job_attachments.cjs — v2 with regex anchor (whitespace-tolerant)
// US-D1 hotfix: add upload dropzone to JobDetailPanel attachments section
const fs = require('fs');
const path = require('path');

const FILE = path.join('src', 'App.tsx');
const original = fs.readFileSync(FILE, 'utf8');

// Idempotency
if (original.includes('US-D1: Job-stage attachment upload')) {
    console.log('SKIP: patch already present');
    process.exit(0);
}

// Whitespace-tolerant anchor — match the JobDetailPanel attachments closing pattern.
// We look for: file_size span -> </a> -> ))} -> </div> -> </div> -> )}
// followed by something that is NOT another attachment block (i.e. the next sibling).
// The unique signature is the file_size KB display followed by the triple-close.
const ANCHOR_RE = /(\{att\.file_size && <span className="text-gray-400">\{\(att\.file_size\/1024\)\.toFixed\(0\)\}KB<\/span>\}\s*<\/a>\s*\)\)\}\s*<\/div>\s*<\/div>\s*\)\})/;

const matches = original.match(new RegExp(ANCHOR_RE.source, 'g'));
if (!matches) {
    console.error('FAIL: anchor regex matched zero times');
    process.exit(1);
}
if (matches.length > 1) {
    console.error(`FAIL: anchor matched ${matches.length} times — refusing ambiguous patch`);
    process.exit(1);
}

const PATCH_INSERT = `

        {/* US-D1: Job-stage attachment upload (mirrors RFQ panel pattern) */}
        <div className="border-t border-gray-200 pt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Add Attachments</p>
          <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50 rounded-lg cursor-pointer transition-colors">
            <Paperclip size={16} className="text-gray-400" />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-700">Click to attach files</p>
              <p className="text-xs text-gray-400">Drawings, QCPs, photos, internal orders - any file type</p>
            </div>
            <input type="file" multiple className="hidden" onChange={async (e) => {
              const files = e.target.files
              if (!files || files.length === 0) return
              for (const file of Array.from(files)) {
                const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
                const filePath = \`jobs/\${job.id}/\${Date.now()}-\${safeName}\`
                const { error: upErr } = await supabase.storage.from('rfq-attachments').upload(filePath, file)
                if (!upErr) {
                  await supabase.from('job_attachments').insert({ job_id: job.id, file_name: file.name, file_path: filePath, file_size: file.size })
                  await supabase.from('activity_log').insert({
                    action_type: 'job_attachment_added',
                    entity_type: 'job',
                    entity_id: job.id,
                    file_name: JSON.stringify({ job_id: job.id, file_name: file.name, file_size: file.size, added_at: new Date().toISOString() }),
                    metadata: { source: 'job_attachment_added', job_number: job.job_number, file_name: file.name },
                    imported_at: new Date().toISOString(),
                    imported_by: 'user',
                  })
                }
              }
              const { data } = await supabase.from('job_attachments').select('*').eq('job_id', job.id)
              if (data) setAttachments(data)
              showMsg('Attachment(s) added')
            }} />
          </label>
        </div>`;

// Replace the matched anchor with: anchor + injected block
const patched = original.replace(ANCHOR_RE, (full) => full + PATCH_INSERT);

if (patched === original) {
    console.error('FAIL: replace produced no change');
    process.exit(1);
}

fs.writeFileSync(FILE, patched, 'utf8');
console.log('OK: patched src/App.tsx (+' + PATCH_INSERT.length + ' bytes)');
console.log('Next: npm run build && npx vercel --prod');