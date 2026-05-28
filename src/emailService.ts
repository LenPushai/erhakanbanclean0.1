// ============================================================================
// ERHA Email Notification Service
// PUSH AI Foundation — Proverbs 16:3
// ============================================================================

import { PEOPLE } from './emailRecipients'

const FROM_EMAIL = 'ERHA Operations <onboarding@resend.dev>'

// Resolved at module load. Browser-side fallback to current origin keeps dev
// links working without forcing a .env.local entry on every workstation; the
// serverless side (api/sign-submit.js) reads process.env.VITE_APP_URL and
// fails loudly if missing — see TODO_PRE_MONDAY.md.
const APP_URL = (import.meta as any).env?.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')

const ALL = [PEOPLE.Len, PEOPLE.Hendrik, PEOPLE.Jeanic]

async function sendEmail(to: string[], subject: string, html: string) {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, html }),
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
const footer = `<div style="${footerStyle}">ERHA · PUSH AI © 2026</div>`
const infoRow = (label: string, value: any) => `<tr><td style="padding:4px 8px;font-weight:bold;color:#6b7280;width:140px">${label}</td><td style="padding:4px 8px;color:#1f2937">${value || '—'}</td></tr>`

export async function emailRFQCreated(rfq: any) {
  const subject = `📋 New RFQ Received — ${rfq.rfq_no || 'New'}`
  const html = `<div style="max-width:600px;margin:0 auto">
    <div style="${headerStyle}"><h2 style="margin:0">📋 New RFQ Received</h2></div>
    <div style="${bodyStyle}">
      <p style="margin-bottom:16px">A new Request for Quotation has been received and is ready for quoter assignment.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
        ${infoRow('RFQ Number', rfq.rfq_no)}
        ${infoRow('Description', rfq.description)}
        ${infoRow('Client', rfq.client_name || rfq.clients?.company_name)}
        ${infoRow('Priority', rfq.priority)}
        ${infoRow('Date Received', rfq.request_date)}
        ${infoRow('Required By', rfq.required_date)}
      </table>
      ${footer}
    </div>
  </div>`
  await sendEmail(ALL, subject, html)
}

export async function emailQuoterAssigned(rfq: any, quoterName: string) {
  const subject = `📐 RFQ Assigned to You — ${rfq.rfq_no}`
  const html = `<div style="max-width:600px;margin:0 auto">
    <div style="${headerStyle}"><h2 style="margin:0">📐 RFQ Assigned to You</h2></div>
    <div style="${bodyStyle}">
      <p style="margin-bottom:16px">Hi <strong>${quoterName}</strong>, the following RFQ has been assigned to you.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
        ${infoRow('RFQ Number', rfq.rfq_no)}
        ${infoRow('Description', rfq.description)}
        ${infoRow('Client', rfq.client_name || rfq.clients?.company_name)}
        ${infoRow('Priority', rfq.priority)}
        ${infoRow('Required By', rfq.required_date)}
      </table>
      ${footer}
    </div>
  </div>`
  await sendEmail(ALL, subject, html)
}

export async function emailQuoteReady(rfq: any) {
  const subject = `✅ Quote Ready for Approval — ${rfq.rfq_no}`
  const html = `<div style="max-width:600px;margin:0 auto">
    <div style="${headerStyle}"><h2 style="margin:0">✅ Quote Ready for Approval</h2></div>
    <div style="${bodyStyle}">
      <p style="margin-bottom:16px">A quotation is ready and requires manager approval.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
        ${infoRow('RFQ Number', rfq.rfq_no)}
        ${infoRow('Description', rfq.description)}
        ${infoRow('Client', rfq.client_name || rfq.clients?.company_name)}
        ${infoRow('Quote Number', rfq.quote_number)}
        ${infoRow('Quote Value', rfq.quote_value_excl ? 'R ' + Number(rfq.quote_value_excl).toLocaleString('en-ZA') + ' excl VAT' : '—')}
      </table>
      ${footer}
    </div>
  </div>`
  await sendEmail(ALL, subject, html)
}

export async function emailOrderWon(rfq: any, jobNumber: string) {
  const subject = `🏆 Order Won — ${rfq.rfq_no} — Job ${jobNumber} Created`
  const html = `<div style="max-width:600px;margin:0 auto">
    <div style="${headerStyle}"><h2 style="margin:0">🏆 Order Won!</h2></div>
    <div style="${bodyStyle}">
      <p style="margin-bottom:16px">An order has been confirmed and a job has been created on the Job Board.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
        ${infoRow('RFQ Number', rfq.rfq_no)}
        ${infoRow('Job Number', jobNumber)}
        ${infoRow('Client', rfq.client_name || rfq.clients?.company_name)}
        ${infoRow('Description', rfq.description)}
        ${infoRow('PO Number', rfq.po_number)}
        ${infoRow('Order Date', rfq.order_date)}
      </table>
      <p style="margin-top:16px;color:#6b7280">The job is now in <strong>PENDING</strong> status on the Job Board.</p>
      ${footer}
    </div>
  </div>`
  await sendEmail(ALL, subject, html)
}

export async function emailJobInReview(job: any) {
  const subject = `🔍 Job In Review — ${job.job_number}`
  const html = `<div style="max-width:600px;margin:0 auto">
    <div style="${headerStyle}"><h2 style="margin:0">🔍 Job Card In Review</h2></div>
    <div style="${bodyStyle}">
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
        ${infoRow('Job Number', job.job_number)}
        ${infoRow('Client', job.client_name)}
        ${infoRow('Description', job.description)}
        ${infoRow('Priority', job.priority)}
        ${infoRow('Due Date', job.due_date)}
        ${infoRow('Assigned To', job.assigned_employee_name)}
        ${infoRow('Supervisor', job.assigned_supervisor_name)}
      </table>
      ${footer}
    </div>
  </div>`
  await sendEmail(ALL, subject, html)
}

export async function emailJobReadyToPrint(job: any) {
  const subject = `🖨️ Job Card Ready to Print — ${job.job_number}`
  const html = `<div style="max-width:600px;margin:0 auto">
    <div style="${headerStyle}"><h2 style="margin:0">🖨️ Job Card Ready to Print</h2></div>
    <div style="${bodyStyle}">
      <p style="margin-bottom:16px">The following job card is ready to be printed for the workshop floor.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
        ${infoRow('Job Number', job.job_number)}
        ${infoRow('Client', job.client_name)}
        ${infoRow('Description', job.description)}
        ${infoRow('Priority', job.priority)}
        ${infoRow('Due Date', job.due_date)}
        ${infoRow('Assigned To', job.assigned_employee_name)}
        ${infoRow('Supervisor', job.assigned_supervisor_name)}
      </table>
      ${footer}
    </div>
  </div>`
  await sendEmail(ALL, subject, html)
}

export async function emailJobPrinted(job: any) {
  const subject = `✅ Job Card Printed — ${job.job_number} — On Workshop Floor`
  const html = `<div style="max-width:600px;margin:0 auto">
    <div style="${headerStyle}"><h2 style="margin:0">✅ Job Card Printed</h2></div>
    <div style="${bodyStyle}">
      <p style="margin-bottom:16px">Job card has been printed and handed to the workshop floor.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
        ${infoRow('Job Number', job.job_number)}
        ${infoRow('Client', job.client_name)}
        ${infoRow('Description', job.description)}
        ${infoRow('Priority', job.priority)}
        ${infoRow('Due Date', job.due_date)}
        ${infoRow('Assigned To', job.assigned_employee_name)}
        ${infoRow('Supervisor', job.assigned_supervisor_name)}
      </table>
      ${footer}
    </div>
  </div>`
  await sendEmail(ALL, subject, html)
}

export async function emailChildJobSpawned(parentJob: any, childJob: any) {
  const subject = `↳ Child Job Created — ${childJob.job_number} from ${parentJob.job_number}`
  const html = `<div style="max-width:600px;margin:0 auto">
    <div style="${headerStyle}"><h2 style="margin:0">↳ Child Job Spawned</h2></div>
    <div style="${bodyStyle}">
      <p style="margin-bottom:16px">A child job has been created from a line item.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
        ${infoRow('Child Job Number', childJob.job_number)}
        ${infoRow('Parent Job', parentJob.job_number)}
        ${infoRow('Client', childJob.client_name)}
        ${infoRow('Description', childJob.description)}
        ${infoRow('Due Date', childJob.due_date)}
      </table>
      ${footer}
    </div>
  </div>`
  await sendEmail(ALL, subject, html)
}

export async function emailJobStarted(job: any) {
  const subject = `[Job Started] ${job.job_number}`
  const html = `<div style="max-width:600px;margin:0 auto">
    <div style="${headerStyle}"><h2 style="margin:0">Job Started</h2></div>
    <div style="${bodyStyle}">
      <p style="margin-bottom:16px">A job has been started on the workshop floor.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
        ${infoRow('Job Number', job.job_number)}
        ${infoRow('Client', job.client_name)}
        ${infoRow('Description', job.description)}
        ${infoRow('Due Date', job.due_date)}
        ${infoRow('Priority', job.priority)}
      </table>
      ${footer}
    </div>
  </div>`
  await sendEmail(ALL, subject, html)
}

export async function emailJobQCCheck(job: any) {
  const subject = `[QC Check Required] ${job.job_number}`
  const html = `<div style="max-width:600px;margin:0 auto">
    <div style="${headerStyle}"><h2 style="margin:0">QC Check Required</h2></div>
    <div style="${bodyStyle}">
      <p style="margin-bottom:16px">A job is ready for quality control inspection.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
        ${infoRow('Job Number', job.job_number)}
        ${infoRow('Client', job.client_name)}
        ${infoRow('Description', job.description)}
        ${infoRow('Due Date', job.due_date)}
      </table>
      <p style="color:#d97706;font-weight:600;margin-top:16px">Action Required: Complete all 9 QC holding points before marking complete.</p>
      ${footer}
    </div>
  </div>`
  await sendEmail(ALL, subject, html)
}

export async function emailJobComplete(job: any) {
  const subject = `[Job Complete] ${job.job_number}`
  const html = `<div style="max-width:600px;margin:0 auto">
    <div style="${headerStyle}"><h2 style="margin:0">Job Complete</h2></div>
    <div style="${bodyStyle}">
      <p style="margin-bottom:16px">A job has been completed and is ready for dispatch.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
        ${infoRow('Job Number', job.job_number)}
        ${infoRow('Client', job.client_name)}
        ${infoRow('Description', job.description)}
        ${infoRow('Due Date', job.due_date)}
      </table>
      <p style="color:#16a34a;font-weight:600;margin-top:16px">Action Required: Arrange delivery and capture invoice in Pastel.</p>
      ${footer}
    </div>
  </div>`
  await sendEmail(ALL, subject, html)
}

export async function emailJobDispatched(job: any) {
  const subject = `[Job Dispatched] ${job.job_number}`
  const html = `<div style="max-width:600px;margin:0 auto">
    <div style="${headerStyle}"><h2 style="margin:0">Job Dispatched</h2></div>
    <div style="${bodyStyle}">
      <p style="margin-bottom:16px">A job has been dispatched to the client.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
        ${infoRow('Job Number', job.job_number)}
        ${infoRow('Client', job.client_name)}
        ${infoRow('Description', job.description)}
      </table>
      ${footer}
    </div>
  </div>`
  await sendEmail(ALL, subject, html)
}

// US-P3-012: Hendrik has internally signed off the quote. Status is now
// INTERNALLY_APPROVED — Jeanic is the gate-keeper for the customer send.
export async function emailReadyToSend(rfq: any) {
  const clientName = rfq.client_name || rfq.clients?.company_name || '—'
  const subject = `Quote ready to send to ${clientName} — ${rfq.rfq_no || rfq.enq_number || 'RFQ'}`
  const html = `<div style="max-width:600px;margin:0 auto">
    <div style="${headerStyle}"><h2 style="margin:0">Quote Ready to Send</h2></div>
    <div style="${bodyStyle}">
      <p style="margin-bottom:16px">Hendrik has signed off the quote for <strong>${clientName}</strong>.
      It is ready for you to send to the customer from the RFQ Board.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
        ${infoRow('RFQ Number', rfq.rfq_no)}
        ${infoRow('Client', clientName)}
        ${infoRow('Description', rfq.description)}
        ${infoRow('Quote Number', rfq.quote_number)}
        ${infoRow('Quote Value', rfq.quote_value_excl_vat ? 'R ' + Number(rfq.quote_value_excl_vat).toLocaleString('en-ZA') + ' excl VAT' : '—')}
      </table>
      <p style="margin-top:16px;color:#6b7280">Open the RFQ on the board and click <strong>Send Quote to Customer</strong>.</p>
      ${footer}
    </div>
  </div>`
  await sendEmail([PEOPLE.Jeanic], subject, html)
}

// US-P3-012: all linked jobs invoiced — DB trigger has flipped the RFQ to
// COMPLETED. Operationally, this email fires from the cron handler at
// api/cron/notify-completed-rfqs.js (which composes the template inline
// and stamps rfqs.completion_email_sent_at for idempotency). This
// frontend export is kept for symmetry with the other emailXxx exports
// and as a future "Re-send completion email" button hook — it is not
// currently wired to any caller.
export async function emailRfqCompleted(rfq: any) {
  const clientName = rfq.client_name || rfq.clients?.company_name || '—'
  const subject = `RFQ ${rfq.rfq_no || 'RFQ'} completed — ${clientName}`
  const html = `<div style="max-width:600px;margin:0 auto">
    <div style="${headerStyle}"><h2 style="margin:0">RFQ Completed</h2></div>
    <div style="${bodyStyle}">
      <p style="margin-bottom:16px">Job for <strong>${clientName}</strong> has been fully invoiced.
      The RFQ is now closed out on the board.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
        ${infoRow('RFQ Number', rfq.rfq_no)}
        ${infoRow('Client', clientName)}
        ${infoRow('Description', rfq.description)}
        ${infoRow('Invoice Number', rfq.invoice_number)}
        ${infoRow('Invoice Value', rfq.invoice_value ? 'R ' + Number(rfq.invoice_value).toLocaleString('en-ZA') : '—')}
      </table>
      ${footer}
    </div>
  </div>`
  await sendEmail([PEOPLE.Hendrik, PEOPLE.Jeanic], subject, html)
}
