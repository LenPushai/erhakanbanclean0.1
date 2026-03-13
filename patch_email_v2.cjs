const fs = require('fs');
const path = require('path');

// 1. Write emailService.ts directly to src/
const emailServiceContent = `// ============================================================================
// ERHA Email Notification Service
// PUSH AI Foundation — Proverbs 16:3
// ============================================================================

const RESEND_API_KEY = 're_Q3RKYakG_9yGoARH977FNLhwF2rG9Y8vk'
const FROM_EMAIL = 'ERHA Operations <onboarding@resend.dev>'

const RECIPIENTS = {
  len: 'lenklopper03@gmail.com',
  hendrik: 'hendrik@erha.co.za',
  juanic: 'pa@erha.co.za',
}

const ALL = [RECIPIENTS.len, RECIPIENTS.hendrik, RECIPIENTS.juanic]

async function sendEmail(to: string[], subject: string, html: string) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${RESEND_API_KEY}\`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    })
    const data = await res.json()
    if (!res.ok) console.error('Email error:', data)
    else console.log('Email sent:', subject)
  } catch (err) {
    console.error('Email send failed:', err)
  }
}

const headerStyle = 'background:linear-gradient(135deg,#1e3a5f,#2d5a8e);color:white;padding:20px;border-radius:8px 8px 0 0'
const bodyStyle = 'padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;font-family:Arial,sans-serif'
const footerStyle = 'margin-top:20px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center'
const footer = \`<div style="\${footerStyle}">ERHA Fabrication & Construction · PUSH AI Foundation © 2026</div>\`
const infoRow = (label: string, value: any) => \`<tr><td style="padding:4px 8px;font-weight:bold;color:#6b7280;width:140px">\${label}</td><td style="padding:4px 8px;color:#1f2937">\${value || '—'}</td></tr>\`

export async function emailRFQCreated(rfq: any) {
  const subject = \`📋 New RFQ Received — \${rfq.rfq_no || 'New'}\`
  const html = \`<div style="max-width:600px;margin:0 auto">
    <div style="\${headerStyle}"><h2 style="margin:0">📋 New RFQ Received</h2></div>
    <div style="\${bodyStyle}">
      <p style="margin-bottom:16px">A new Request for Quotation has been received and is ready for quoter assignment.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
        \${infoRow('RFQ Number', rfq.rfq_no)}
        \${infoRow('Description', rfq.description)}
        \${infoRow('Client', rfq.client_name || rfq.clients?.company_name)}
        \${infoRow('Priority', rfq.priority)}
        \${infoRow('Date Received', rfq.request_date)}
        \${infoRow('Required By', rfq.required_date)}
      </table>
      \${footer}
    </div>
  </div>\`
  await sendEmail(ALL, subject, html)
}

export async function emailQuoterAssigned(rfq: any, quoterName: string) {
  const subject = \`📐 RFQ Assigned to You — \${rfq.rfq_no}\`
  const html = \`<div style="max-width:600px;margin:0 auto">
    <div style="\${headerStyle}"><h2 style="margin:0">📐 RFQ Assigned to You</h2></div>
    <div style="\${bodyStyle}">
      <p style="margin-bottom:16px">Hi <strong>\${quoterName}</strong>, the following RFQ has been assigned to you.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
        \${infoRow('RFQ Number', rfq.rfq_no)}
        \${infoRow('Description', rfq.description)}
        \${infoRow('Client', rfq.client_name || rfq.clients?.company_name)}
        \${infoRow('Priority', rfq.priority)}
        \${infoRow('Required By', rfq.required_date)}
      </table>
      \${footer}
    </div>
  </div>\`
  await sendEmail(ALL, subject, html)
}

export async function emailQuoteReady(rfq: any) {
  const subject = \`✅ Quote Ready for Approval — \${rfq.rfq_no}\`
  const html = \`<div style="max-width:600px;margin:0 auto">
    <div style="\${headerStyle}"><h2 style="margin:0">✅ Quote Ready for Approval</h2></div>
    <div style="\${bodyStyle}">
      <p style="margin-bottom:16px">A quotation is ready and requires manager approval.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
        \${infoRow('RFQ Number', rfq.rfq_no)}
        \${infoRow('Description', rfq.description)}
        \${infoRow('Client', rfq.client_name || rfq.clients?.company_name)}
        \${infoRow('Quote Number', rfq.quote_number)}
        \${infoRow('Quote Value', rfq.quote_value_excl ? 'R ' + Number(rfq.quote_value_excl).toLocaleString('en-ZA') + ' excl VAT' : '—')}
      </table>
      \${footer}
    </div>
  </div>\`
  await sendEmail(ALL, subject, html)
}

export async function emailOrderWon(rfq: any, jobNumber: string) {
  const subject = \`🏆 Order Won — \${rfq.rfq_no} — Job \${jobNumber} Created\`
  const html = \`<div style="max-width:600px;margin:0 auto">
    <div style="\${headerStyle}"><h2 style="margin:0">🏆 Order Won!</h2></div>
    <div style="\${bodyStyle}">
      <p style="margin-bottom:16px">An order has been confirmed and a job has been created on the Job Board.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
        \${infoRow('RFQ Number', rfq.rfq_no)}
        \${infoRow('Job Number', jobNumber)}
        \${infoRow('Client', rfq.client_name || rfq.clients?.company_name)}
        \${infoRow('Description', rfq.description)}
        \${infoRow('PO Number', rfq.po_number)}
        \${infoRow('Order Date', rfq.order_date)}
      </table>
      <p style="margin-top:16px;color:#6b7280">The job is now in <strong>PENDING</strong> status on the Job Board.</p>
      \${footer}
    </div>
  </div>\`
  await sendEmail(ALL, subject, html)
}

export async function emailJobInReview(job: any) {
  const subject = \`🔍 Job In Review — \${job.job_number}\`
  const html = \`<div style="max-width:600px;margin:0 auto">
    <div style="\${headerStyle}"><h2 style="margin:0">🔍 Job Card In Review</h2></div>
    <div style="\${bodyStyle}">
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
        \${infoRow('Job Number', job.job_number)}
        \${infoRow('Client', job.client_name)}
        \${infoRow('Description', job.description)}
        \${infoRow('Priority', job.priority)}
        \${infoRow('Due Date', job.due_date)}
        \${infoRow('Assigned To', job.assigned_employee_name)}
        \${infoRow('Supervisor', job.assigned_supervisor_name)}
      </table>
      \${footer}
    </div>
  </div>\`
  await sendEmail(ALL, subject, html)
}

export async function emailJobReadyToPrint(job: any) {
  const subject = \`🖨️ Job Card Ready to Print — \${job.job_number}\`
  const html = \`<div style="max-width:600px;margin:0 auto">
    <div style="\${headerStyle}"><h2 style="margin:0">🖨️ Job Card Ready to Print</h2></div>
    <div style="\${bodyStyle}">
      <p style="margin-bottom:16px">The following job card is ready to be printed for the workshop floor.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
        \${infoRow('Job Number', job.job_number)}
        \${infoRow('Client', job.client_name)}
        \${infoRow('Description', job.description)}
        \${infoRow('Priority', job.priority)}
        \${infoRow('Due Date', job.due_date)}
        \${infoRow('Assigned To', job.assigned_employee_name)}
        \${infoRow('Supervisor', job.assigned_supervisor_name)}
      </table>
      \${footer}
    </div>
  </div>\`
  await sendEmail(ALL, subject, html)
}

export async function emailJobPrinted(job: any) {
  const subject = \`✅ Job Card Printed — \${job.job_number} — On Workshop Floor\`
  const html = \`<div style="max-width:600px;margin:0 auto">
    <div style="\${headerStyle}"><h2 style="margin:0">✅ Job Card Printed</h2></div>
    <div style="\${bodyStyle}">
      <p style="margin-bottom:16px">Job card has been printed and handed to the workshop floor.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
        \${infoRow('Job Number', job.job_number)}
        \${infoRow('Client', job.client_name)}
        \${infoRow('Description', job.description)}
        \${infoRow('Priority', job.priority)}
        \${infoRow('Due Date', job.due_date)}
        \${infoRow('Assigned To', job.assigned_employee_name)}
        \${infoRow('Supervisor', job.assigned_supervisor_name)}
      </table>
      \${footer}
    </div>
  </div>\`
  await sendEmail(ALL, subject, html)
}

export async function emailChildJobSpawned(parentJob: any, childJob: any) {
  const subject = \`↳ Child Job Created — \${childJob.job_number} from \${parentJob.job_number}\`
  const html = \`<div style="max-width:600px;margin:0 auto">
    <div style="\${headerStyle}"><h2 style="margin:0">↳ Child Job Spawned</h2></div>
    <div style="\${bodyStyle}">
      <p style="margin-bottom:16px">A child job has been created from a line item.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
        \${infoRow('Child Job Number', childJob.job_number)}
        \${infoRow('Parent Job', parentJob.job_number)}
        \${infoRow('Client', childJob.client_name)}
        \${infoRow('Description', childJob.description)}
        \${infoRow('Due Date', childJob.due_date)}
      </table>
      \${footer}
    </div>
  </div>\`
  await sendEmail(ALL, subject, html)
}
`;

fs.writeFileSync(path.join(__dirname, 'src', 'emailService.ts'), emailServiceContent, 'utf8');
console.log('PASS: emailService.ts written to src/');

// 2. Wire up imports and triggers in App.tsx
const filePath = path.join(__dirname, 'src/App.tsx');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Add import after supabase import
const supabaseImportIdx = lines.findIndex(l => l.includes("from './lib/supabase'"));
if (!lines.some(l => l.includes('emailService'))) {
  lines.splice(supabaseImportIdx + 1, 0,
    "import { emailRFQCreated, emailQuoterAssigned, emailQuoteReady, emailOrderWon, emailJobInReview, emailJobReadyToPrint, emailJobPrinted, emailChildJobSpawned } from './emailService'"
  );
  console.log('PASS: email imports added');
} else {
  console.log('PASS: email imports already exist');
}

// 3. Wire email into handleJobStatusChange
const statusChangeIdx = lines.findIndex(l => l.includes('const handleJobStatusChange = async'));
let statusChangeEnd = statusChangeIdx;
for (let i = statusChangeIdx + 1; i < lines.length; i++) {
  if (lines[i].trim() === '}') { statusChangeEnd = i; break; }
}
lines.splice(statusChangeIdx, statusChangeEnd - statusChangeIdx + 1,
  "  const handleJobStatusChange = async (jobId: string, newStatus: string) => {",
  "    await supabase.from('jobs').update({ status: newStatus }).eq('id', jobId)",
  "    const { data: job } = await supabase.from('jobs').select('*').eq('id', jobId).single()",
  "    if (job) {",
  "      if (newStatus === 'IN_REVIEW') emailJobInReview(job)",
  "      if (newStatus === 'READY_TO_PRINT') emailJobReadyToPrint(job)",
  "      if (newStatus === 'PRINTED') emailJobPrinted(job)",
  "    }",
  "    fetchJobs()",
  "  }"
);
console.log('PASS: handleJobStatusChange wired with email triggers');

// 4. Wire email into Order Won
const orderWonMsgIdx = lines.findIndex(l => l.includes("showMsg('Order won!"));
if (orderWonMsgIdx >= 0) {
  lines.splice(orderWonMsgIdx, 0, "        if (jobData) emailOrderWon(data, jobData.job_number || '')");
  console.log('PASS: emailOrderWon wired');
} else {
  console.log('FAIL: Order Won showMsg not found');
}

// 5. Wire email into spawn
const spawnMsgIdx = lines.findIndex(l => l.includes("showMsg('Child job ") && l.includes('created!'));
if (spawnMsgIdx >= 0) {
  lines.splice(spawnMsgIdx, 0, "      if (childJob) emailChildJobSpawned(job, childJob)");
  console.log('PASS: emailChildJobSpawned wired');
} else {
  console.log('FAIL: Spawn showMsg not found');
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('');
console.log('Total lines:', lines.length);
console.log('Done - run: npx vite --force');
