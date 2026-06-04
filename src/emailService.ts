// ============================================================================
// ERHA Email Notification Service
// PUSH AI Foundation — Proverbs 16:3
// ============================================================================

import { PEOPLE } from './emailRecipients'
import { supabase } from './lib/supabase'

const FROM_EMAIL = 'ERHA Operations <onboarding@resend.dev>'

// Resolved at module load. Browser-side fallback to current origin keeps dev
// links working without forcing a .env.local entry on every workstation; the
// serverless side (api/sign-submit.js) reads process.env.VITE_APP_URL and
// fails loudly if missing — see TODO_PRE_MONDAY.md.
const APP_URL = (import.meta as any).env?.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')

const ALL = [PEOPLE.Len, PEOPLE.Hendrik, PEOPLE.Jeanic]

// E6 — surface both the system number and the customer's own reference
// where one exists. Templates that currently show `rfq.rfq_no` are migrated
// to this helper.
const formatRfqNumber = (rfq: any) => {
  const sysNo = rfq?.rfq_no || rfq?.enq_number || 'RFQ'
  return rfq?.client_rfq_number ? `${sysNo} (your ref: ${rfq.client_rfq_number})` : sysNo
}

// E3 — locate a quote PDF among the rfq's attachments. Loosened match: any
// PDF whose filename contains the quote_number (case-insensitive),
// most-recently-uploaded wins. Mirrors the loosening in
// api/quote-send-to-customer.js so the two callers see the same result.
async function findQuotePdfAttachment(rfqId: string, quoteNumber: string | null | undefined) {
  if (!quoteNumber) return null
  const { data: rows, error } = await supabase
    .from('rfq_attachments')
    .select('file_name, file_path, created_at')
    .eq('rfq_id', rfqId)
    .ilike('file_name', '%.pdf')
    .order('created_at', { ascending: false })
  if (error || !rows || rows.length === 0) return null
  const needle = String(quoteNumber).toLowerCase()
  const match = rows.find((r: any) => String(r.file_name || '').toLowerCase().includes(needle))
  if (!match) return null
  const { data: urlData } = supabase.storage.from('rfq-attachments').getPublicUrl(match.file_path)
  if (!urlData?.publicUrl) return null
  return { filename: match.file_name as string, path: urlData.publicUrl as string }
}

async function sendEmail(to: string[], subject: string, html: string, attachments?: Array<{ filename: string; path: string }>) {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, html, ...(attachments && attachments.length > 0 ? { attachments } : {}) }),
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
  const subject = `📐 RFQ Assigned to You — ${formatRfqNumber(rfq)}`
  const html = `<div style="max-width:600px;margin:0 auto">
    <div style="${headerStyle}"><h2 style="margin:0">📐 RFQ Assigned to You</h2></div>
    <div style="${bodyStyle}">
      <p style="margin-bottom:16px">Hi <strong>${quoterName}</strong>, the following RFQ has been assigned to you.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
        ${infoRow('RFQ Number', formatRfqNumber(rfq))}
        ${infoRow('Description', rfq.description)}
        ${infoRow('Client', rfq.client_name || rfq.clients?.company_name)}
        ${infoRow('Priority', rfq.priority)}
        ${infoRow('Required By', rfq.required_date)}
      </table>
      ${footer}
    </div>
  </div>`
  // UAT-03: send TO the quoter, with Jeanic retaining oversight.
  // Every assignable QUOTERS value now has a PEOPLE entry (Estimator
  // was dropped from the dropdown in src/App.tsx). Len still receives
  // copies via EMAIL_OVERRIDE_TO in api/_lib/graphMailer.js.
  const quoterEmail = (PEOPLE as Record<string, string>)[quoterName]
  await sendEmail([quoterEmail, PEOPLE.Jeanic], subject, html)
}

export async function emailQuoteReady(rfq: any) {
  const subject = `✅ Quote Ready for Approval — ${formatRfqNumber(rfq)}`
  const html = `<div style="max-width:600px;margin:0 auto">
    <div style="${headerStyle}"><h2 style="margin:0">✅ Quote Ready for Approval</h2></div>
    <div style="${bodyStyle}">
      <p style="margin-bottom:16px">A quotation is ready and requires manager approval.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
        ${infoRow('RFQ Number', formatRfqNumber(rfq))}
        ${infoRow('Description', rfq.description)}
        ${infoRow('Client', rfq.client_name || rfq.clients?.company_name)}
        ${infoRow('Quote Number', rfq.quote_number)}
        ${infoRow('Quote Value', rfq.quote_value_excl_vat ? 'R ' + Number(rfq.quote_value_excl_vat).toLocaleString('en-ZA') + ' excl VAT' : '—')}
      </table>
      ${footer}
    </div>
  </div>`
  // E3 — attach the quote PDF if one is uploaded against this RFQ. Best-
  // effort: a miss means no attachment, never a hard failure.
  const pdf = await findQuotePdfAttachment(rfq.id, rfq.quote_number)
  await sendEmail(ALL, subject, html, pdf ? [pdf] : undefined)
}

export async function emailOrderWon(rfq: any, jobNumber: string) {
  const subject = `🏆 Order Won — ${formatRfqNumber(rfq)} — Job ${jobNumber} Created`
  const html = `<div style="max-width:600px;margin:0 auto">
    <div style="${headerStyle}"><h2 style="margin:0">🏆 Order Won!</h2></div>
    <div style="${bodyStyle}">
      <p style="margin-bottom:16px">An order has been confirmed and a job has been created on the Job Board.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
        ${infoRow('RFQ Number', formatRfqNumber(rfq))}
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

// US-P3-012: Quote has been internally signed off. Status is now
// INTERNALLY_APPROVED — Jeanic is the gate-keeper for the customer send.
// E4 — body identifies the quoter and the actual approver by name (was
// hardcoded "Hendrik" regardless of who quoted or who signed).
export async function emailReadyToSend(rfq: any, approverName?: string) {
  const clientName = rfq.client_name || rfq.clients?.company_name || '—'
  const quoterName = rfq.assigned_quoter_name || 'the quoter'
  const approver = approverName || 'a manager'
  const rfqNumberPlain = rfq.rfq_no || rfq.enq_number || 'this RFQ'
  const subject = `Quote ready to send to ${clientName} — ${formatRfqNumber(rfq)}`
  const html = `<div style="max-width:600px;margin:0 auto">
    <div style="${headerStyle}"><h2 style="margin:0">Quote Ready to Send</h2></div>
    <div style="${bodyStyle}">
      <p style="margin-bottom:16px">Quote by <strong>${quoterName}</strong> approved by <strong>${approver}</strong> for RFQ <strong>${rfqNumberPlain}</strong>.
      The quote is ready for you to send to the customer from the RFQ Board.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
        ${infoRow('RFQ Number', formatRfqNumber(rfq))}
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
  const subject = `RFQ ${formatRfqNumber(rfq)} completed — ${clientName}`
  const html = `<div style="max-width:600px;margin:0 auto">
    <div style="${headerStyle}"><h2 style="margin:0">RFQ Completed</h2></div>
    <div style="${bodyStyle}">
      <p style="margin-bottom:16px">Job for <strong>${clientName}</strong> has been fully invoiced.
      The RFQ is now closed out on the board.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
        ${infoRow('RFQ Number', formatRfqNumber(rfq))}
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
