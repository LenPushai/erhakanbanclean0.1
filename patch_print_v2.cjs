const fs = require('fs');
const path = require('path');

// Read logo
const logoPath = path.join(__dirname, 'public', 'erha-logo.png');
let logoB64 = '';
if (fs.existsSync(logoPath)) {
  logoB64 = fs.readFileSync(logoPath).toString('base64');
  console.log('PASS: Logo found');
}

const filePath = path.join(__dirname, 'src/App.tsx');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Find handlePrintJobCard line
let startIdx = -1, endIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const handlePrintJobCard')) { startIdx = i; }
  if (startIdx >= 0 && endIdx === -1 && i > startIdx) {
    if (lines[i].trim() === '}') { endIdx = i; break; }
  }
}
console.log('handlePrintJobCard at lines:', startIdx+1, '-', endIdx+1);

const logoSrc = logoB64 ? `data:image/png;base64,${logoB64}` : '';
const logoHtml = logoSrc
  ? `<img src="${logoSrc}" alt="ERHA" style="height:45px">`
  : `<div style="font-size:20pt;font-weight:900;color:#1e3a5f">ERHA</div>`;

const newFn = [
"  const handlePrintJobCard = async (job: Job) => {",
"    const { data: lineItems } = await supabase.from('job_line_items').select('*').eq('job_id', job.id).order('sort_order')",
"    const items = lineItems || []",
"    const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-ZA') : '—'",
"    const chk = (v: any) => v ? '&#10003;' : ''",
"    const val = (v: any) => v || '—'",
"    const lineItemRows = items.length > 0",
"      ? items.map((item: any, i: number) => `<tr><td class='no-col'>${i+1}</td><td>${item.description||'—'}</td><td class='qty-col'>${item.quantity||1}</td><td class='uom-col'>${item.uom||'EA'}</td><td class='spawn-col'>${item.child_job_id?'<span style=\"color:#16a34a;font-weight:bold\">&#10003; Spawned</span>':'<div style=\"width:13px;height:13px;border:1.5px solid #1e3a5f;margin:auto\"></div>'}</td></tr>`).join('')",
"      : '<tr><td colspan=\"5\" style=\"text-align:center;color:#aaa;padding:8px\">No line items</td></tr>'",
`    const logoHtml = '${logoHtml}'`,
"    const css = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:10pt;color:#1a1a1a;background:white}.page{width:210mm;min-height:297mm;margin:0 auto;padding:8mm 10mm}.header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #1e3a5f;padding-bottom:6px;margin-bottom:8px}.header-title{text-align:center;flex:1}.header-title h1{font-size:18pt;font-weight:900;color:#1e3a5f;letter-spacing:2px;text-transform:uppercase}.header-title p{font-size:8pt;color:#4a9a4a;font-weight:bold}.job-number{font-size:16pt;font-weight:900;color:#1e3a5f;font-family:'Courier New',monospace;text-align:right}.badge{font-size:9pt;font-weight:900;padding:3px 8px;border-radius:3px;display:inline-block;margin-top:3px}.section{border:1.5px solid #1e3a5f;margin-bottom:5px;border-radius:2px}.section-header{background:#1e3a5f;color:white;font-size:8pt;font-weight:bold;padding:3px 8px;letter-spacing:1px;text-transform:uppercase}.section-body{padding:6px 8px}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 16px}.info-row{display:flex;gap:4px;align-items:baseline}.info-label{font-size:8pt;color:#555;font-weight:bold;white-space:nowrap;min-width:90px}.info-value{font-size:9pt;font-weight:600;border-bottom:1px solid #ccc;flex:1;padding-bottom:1px}.description-text{font-size:10pt;font-weight:600;line-height:1.4;min-height:20px}.actions-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:4px}.action-item{display:flex;align-items:center;gap:4px;font-size:9pt}.checkbox{width:13px;height:13px;border:1.5px solid #1e3a5f;display:inline-flex;align-items:center;justify-content:center;font-size:9pt;font-weight:900;color:#1e3a5f;flex-shrink:0}.checked{background:#e8f0fe}.line-items-table{width:100%;border-collapse:collapse;font-size:9pt}.line-items-table th{background:#f0f4f8;border:1px solid #cbd5e0;padding:4px 6px;text-align:left;font-size:8pt;color:#1e3a5f;font-weight:bold;text-transform:uppercase}.line-items-table td{border:1px solid #cbd5e0;padding:5px 6px;vertical-align:top}.line-items-table tr:nth-child(even) td{background:#f9fafb}.no-col{text-align:center;width:25px;color:#666}.qty-col{text-align:center;width:40px}.uom-col{text-align:center;width:45px}.spawn-col{text-align:center;width:60px}.assign-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.assign-label{font-size:8pt;color:#555;font-weight:bold;text-transform:uppercase;letter-spacing:.5px}.assign-value{font-size:10pt;font-weight:600;border-bottom:1.5px solid #1e3a5f;min-height:18px;padding-bottom:2px}.notes-box{border:1px solid #cbd5e0;min-height:30px;padding:4px;font-size:9pt;background:#fafafa}.sig-grid{display:grid;grid-template-columns:1fr 1fr;border:1.5px solid #1e3a5f;border-radius:2px}.sig-block{padding:8px}.sig-block:first-child{border-right:1.5px solid #1e3a5f}.sig-label{font-size:8pt;font-weight:bold;color:#1e3a5f;text-transform:uppercase;margin-bottom:4px}.sig-line{border-bottom:1.5px solid #1a1a1a;height:35px;margin-bottom:6px}.sig-date{display:flex;align-items:center;gap:6px;font-size:9pt}.sig-date-line{border-bottom:1px solid #1a1a1a;flex:1;height:16px}.footer{margin-top:6px;border-top:1px solid #1e3a5f;padding-top:4px;display:flex;justify-content:space-between;font-size:7pt;color:#888}.print-bar{background:#1e3a5f;color:white;padding:10px 20px;text-align:center;position:sticky;top:0;z-index:100}.print-btn{background:#4a9a4a;color:white;border:none;padding:8px 24px;font-size:11pt;font-weight:bold;border-radius:4px;cursor:pointer}@media print{.print-bar{display:none}@page{size:A4;margin:0}.page{margin:0;padding:8mm 10mm;width:100%}}`",
"    const html = `<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Job Card - ${val(job.job_number)}</title><style>${css}</style></head><body>",
"<div class='print-bar'><button class='print-btn' onclick='window.print()'>&#128424; Print Job Card</button> <span style='font-size:9pt;opacity:.8'>Ctrl+P → Save as PDF</span></div>",
"<div class='page'>",
"<div class='header'><div>${logoHtml}</div><div class='header-title'><h1>Job Card</h1><p>ERHA OPERATIONS MANAGEMENT SYSTEM</p></div><div><div class='job-number'>${val(job.job_number)}</div>${job.is_emergency?'<div class=\"badge\" style=\"background:#dc2626;color:white\">&#9888; EMERGENCY</div>':''}${job.is_parent?'<div class=\"badge\" style=\"background:#7c3aed;color:white\">PARENT JOB</div>':''}${job.entry_type==='DIRECT'?'<div class=\"badge\" style=\"background:#ea7c1e;color:white\">DIRECT</div>':''}</div></div>",
"<div class='section'><div class='section-header'>Job Information</div><div class='section-body'><div class='info-grid'>",
"<div class='info-row'><span class='info-label'>Client:</span><span class='info-value'>${val(job.client_name)}</span></div>",
"<div class='info-row'><span class='info-label'>Date Received:</span><span class='info-value'>${fmtDate(job.date_received)}</span></div>",
"<div class='info-row'><span class='info-label'>RFQ Reference:</span><span class='info-value'>${val(job.rfq_no)}</span></div>",
"<div class='info-row'><span class='info-label'>Due Date:</span><span class='info-value'>${fmtDate(job.due_date)}</span></div>",
"<div class='info-row'><span class='info-label'>Site / PO:</span><span class='info-value'>${val(job.site_req)}</span></div>",
"<div class='info-row'><span class='info-label'>Priority:</span><span class='info-value'>${val(job.priority)}</span></div>",
"<div class='info-row'><span class='info-label'>Contact Person:</span><span class='info-value'>${val(job.contact_person)}</span></div>",
"<div class='info-row'><span class='info-label'>Contract Work:</span><span class='info-value'>${job.is_contract_work?'YES':'NO'}</span></div>",
"<div class='info-row'><span class='info-label'>Contact Phone:</span><span class='info-value'>${val(job.contact_phone)}</span></div>",
"<div class='info-row'><span class='info-label'>Compiled By:</span><span class='info-value'>${val(job.compiled_by)}</span></div>",
"</div></div></div>",
"<div class='section'><div class='section-header'>Description of Work</div><div class='section-body'><div class='description-text'>${val(job.description)}</div></div></div>",
"<div class='section'><div class='section-header'>Actions Required</div><div class='section-body'><div class='actions-grid'>",
"<div class='action-item'><div class='checkbox ${job.action_manufacture?'checked':''}'>${chk(job.action_manufacture)}</div> Manufacture</div>",
"<div class='action-item'><div class='checkbox ${job.action_sandblast?'checked':''}'>${chk(job.action_sandblast)}</div> Sandblast</div>",
"<div class='action-item'><div class='checkbox ${job.action_prepare_material?'checked':''}'>${chk(job.action_prepare_material)}</div> Prepare Material</div>",
"<div class='action-item'><div class='checkbox ${job.action_service?'checked':''}'>${chk(job.action_service)}</div> Service</div>",
"<div class='action-item'><div class='checkbox ${job.action_paint?'checked':''}'>${chk(job.action_paint)}</div> Paint</div>",
"<div class='action-item'><div class='checkbox ${job.action_repair?'checked':''}'>${chk(job.action_repair)}</div> Repair</div>",
"<div class='action-item'><div class='checkbox ${job.action_installation?'checked':''}'>${chk(job.action_installation)}</div> Installation</div>",
"<div class='action-item'><div class='checkbox ${job.action_cut?'checked':''}'>${chk(job.action_cut)}</div> Cut</div>",
"<div class='action-item'><div class='checkbox ${job.action_modify?'checked':''}'>${chk(job.action_modify)}</div> Modify</div>",
"<div class='action-item'><div class='checkbox ${job.action_other?'checked':''}'>${chk(job.action_other)}</div> Other</div>",
"</div></div></div>",
"<div class='section'><div class='section-header'>Scope of Work — Line Items</div><div class='section-body' style='padding:0'><table class='line-items-table'><thead><tr><th class='no-col'>#</th><th>Description</th><th class='qty-col'>Qty</th><th class='uom-col'>UOM</th><th class='spawn-col'>Child Job</th></tr></thead><tbody>${lineItemRows}</tbody></table></div></div>",
"<div class='section'><div class='section-header'>Assignment &amp; Instructions</div><div class='section-body'>",
"<div class='assign-grid' style='margin-bottom:8px'><div><span class='assign-label'>Assigned Employee</span><div class='assign-value'>${val(job.assigned_employee_name)}</div></div><div><span class='assign-label'>Supervisor</span><div class='assign-value'>${val(job.assigned_supervisor_name)}</div></div></div>",
"<div style='margin-bottom:6px'><div class='assign-label' style='margin-bottom:3px'>Special Requirements</div><div class='notes-box'>${val(job.special_requirements)}</div></div>",
"<div><div class='assign-label' style='margin-bottom:3px'>Notes</div><div class='notes-box'>${val(job.notes)}</div></div>",
"</div></div>",
"<div class='sig-grid'><div class='sig-block'><div class='sig-label'>Employee Signature</div><div class='sig-line'></div><div class='sig-date'><span>Date:</span><div class='sig-date-line'></div><span>/</span><div class='sig-date-line'></div><span>/</span><div class='sig-date-line'></div></div></div><div class='sig-block'><div class='sig-label'>Supervisor Signature</div><div class='sig-line'></div><div class='sig-date'><span>Date:</span><div class='sig-date-line'></div><span>/</span><div class='sig-date-line'></div><span>/</span><div class='sig-date-line'></div></div></div></div>",
"<div class='footer'><span>ERHA Fabrication &amp; Construction — Confidential</span><span>Printed: ${new Date().toLocaleString('en-ZA')}</span><span>PUSH AI Foundation &copy; 2026</span></div>",
"</div></body></html>`",
"    const win = window.open('', '_blank')",
"    if (win) { win.document.write(html); win.document.close() }",
"  }",
];

// Replace lines startIdx to endIdx inclusive
lines.splice(startIdx, endIdx - startIdx + 1, ...newFn);
fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('PASS: handlePrintJobCard replaced');
console.log('Total lines:', lines.length);
console.log('Done - run: npx vite --force');
