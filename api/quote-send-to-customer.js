// US-P3-012: Jeanic-triggered "Send Quote to Customer" action.
//
// Posts from the RFQ detail panel's "Send Quote to Customer" button which
// is only visible when rfqs.status='INTERNALLY_APPROVED'. The endpoint:
//
//   1. Atomically flips rfqs.status INTERNALLY_APPROVED -> SENT_TO_CUSTOMER
//      under a .eq('status','INTERNALLY_APPROVED') guard. If the row didn't
//      match the guard (already sent, wrong status, race), returns 409
//      and short-circuits — no email sent.
//   2. Looks up the Pastel quote PDF from rfq_attachments using the
//      filename convention from api/sign-submit.js (Quote-<quote_number>.pdf).
//      Attachment is best-effort — a missing PDF emits a warning header on
//      the response but the email still sends with no attachment.
//   3. Sends a plain (no e-sign link, no token) branded email to the
//      customer with the PDF attached.
//   4. Writes an activity_log entry: action_type='rfq_sent_to_customer'.
//
// No DocuSign envelope, no signature_tokens write, no Stage 2 cascade.
// The legacy two-stage flow was removed 2026-05-18 (commit 8260780).

import { createClient } from '@supabase/supabase-js';
import { sendMail } from './_lib/graphMailer.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Pastel PDF lookup by filename convention (Quote-<quote_number>.pdf,
 * case-insensitive). Mirrors api/sign-submit.js:findPastelQuotePdf —
 * if the convention changes, update BOTH handlers together.
 */
async function findPastelQuotePdf(supabase, rfqId, quoteNumber) {
  if (!quoteNumber) return null;
  const { data: rows, error } = await supabase
    .from('rfq_attachments')
    .select('file_name, file_path')
    .eq('rfq_id', rfqId)
    .ilike('file_name', '%.pdf');
  if (error) {
    console.warn('[pastel-pdf] rfq_attachments lookup failed:', error.message);
    return null;
  }
  if (!rows || rows.length === 0) return null;
  const expectedPrefix = `quote-${String(quoteNumber).toLowerCase()}`;
  const match = rows.find(r => String(r.file_name || '').toLowerCase().startsWith(expectedPrefix));
  if (!match) return null;
  const { data: urlData } = supabase.storage.from('rfq-attachments').getPublicUrl(match.file_path);
  if (!urlData?.publicUrl) {
    console.warn(`[pastel-pdf] getPublicUrl returned no publicUrl for ${match.file_path}`);
    return null;
  }
  return { filename: match.file_name, url: urlData.publicUrl };
}

function buildCustomerEmail({ rfq, pastelPdf }) {
  const enq = rfq.rfq_no || rfq.enq_number || 'RFQ';
  const valueLine = rfq.quote_value_excl_vat
    ? 'R ' + Number(rfq.quote_value_excl_vat).toLocaleString('en-ZA') + ' excl VAT'
    : '—';
  const subject = `Your Quote - ${enq}${rfq.quote_number ? ` (${rfq.quote_number})` : ''}`;
  const attachmentLine = pastelPdf
    ? `<p style="margin-top:16px">Your quote is attached as a PDF.</p>`
    : `<p style="margin-top:16px;color:#b45309"><strong>Note:</strong> the quote PDF could not be attached automatically — it will follow in a separate email shortly.</p>`;
  const html = `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif">
    <div style="background:linear-gradient(135deg,#1e3a5f,#2d5a8e);color:white;padding:20px;border-radius:8px 8px 0 0">
      <h2 style="margin:0">Your Quotation</h2>
    </div>
    <div style="padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
      <p>Thank you for the opportunity to quote. Please find below the summary of your quotation, with the full quote PDF attached.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px;margin-top:12px">
        <tr><td style="padding:4px 8px;font-weight:bold;color:#6b7280;width:140px">RFQ</td><td style="padding:4px 8px">${enq}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;color:#6b7280">Quote</td><td style="padding:4px 8px">${rfq.quote_number || '—'}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;color:#6b7280">Description</td><td style="padding:4px 8px">${rfq.description || '—'}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;color:#6b7280">Quote value</td><td style="padding:4px 8px">${valueLine}</td></tr>
      </table>
      ${attachmentLine}
      <p style="margin-top:20px;color:#6b7280">Should you have any questions, please reply to this email or contact our office on pa@erha.co.za.</p>
    </div>
  </div>`;
  return { subject, html };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Supabase env not configured server-side.' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { rfq_id, to: overrideTo } = req.body || {};
    if (!rfq_id) return res.status(400).json({ error: 'rfq_id required' });

    // 1. Load RFQ with client join for the email body
    const { data: rfq, error: rfqErr } = await supabase
      .from('rfqs')
      .select('id, rfq_no, enq_number, quote_number, description, quote_value_excl_vat, contact_person, contact_email, operating_entity, status, clients(company_name)')
      .eq('id', rfq_id)
      .maybeSingle();
    if (rfqErr) return res.status(500).json({ error: 'RFQ lookup failed: ' + rfqErr.message });
    if (!rfq) return res.status(404).json({ error: 'RFQ not found' });

    if (rfq.status !== 'INTERNALLY_APPROVED') {
      return res.status(409).json({
        error: `Cannot send: RFQ status is '${rfq.status}', expected 'INTERNALLY_APPROVED'.`,
        current_status: rfq.status,
      });
    }

    // 2. Determine customer recipient. Body override > rfq.contact_email.
    const customerEmails = overrideTo
      ? (Array.isArray(overrideTo) ? overrideTo : [overrideTo])
      : (rfq.contact_email ? [rfq.contact_email] : null);
    if (!customerEmails || customerEmails.length === 0) {
      return res.status(400).json({
        error: 'No customer email on file. Add a contact_email on the RFQ or pass a `to` override in the request body.',
      });
    }

    // 3. Atomically flip status before sending. Race-safe: only the first
    //    request to hit the guard wins, and only the winner sends the email.
    const { data: flipped, error: flipErr } = await supabase
      .from('rfqs')
      .update({ status: 'SENT_TO_CUSTOMER' })
      .eq('id', rfq.id)
      .eq('status', 'INTERNALLY_APPROVED')
      .select('id');
    if (flipErr) return res.status(500).json({ error: 'status flip failed: ' + flipErr.message });
    if (!flipped || flipped.length === 0) {
      return res.status(409).json({ error: 'Race: status no longer INTERNALLY_APPROVED. Reload and retry.' });
    }

    // 4. Look up the Pastel quote PDF (best-effort attachment)
    const pastelPdf = await findPastelQuotePdf(supabase, rfq.id, rfq.quote_number);

    // 5. Send the customer email. Recipient override moved to
    //    api/_lib/graphMailer.js (EMAIL_OVERRIDE_TO env) — during cutover
    //    customerEmails is recorded in the mailer's structured log but
    //    redirected to the override target. Clearing EMAIL_OVERRIDE_TO in
    //    Vercel env turns this into the live customer send.
    const { subject, html } = buildCustomerEmail({ rfq, pastelPdf });
    let emailDispatched = false;
    let emailError = null;
    try {
      const result = await sendMail({
        to: customerEmails,
        subject,
        html,
        attachments: pastelPdf ? [{ filename: pastelPdf.filename, path: pastelPdf.url }] : undefined,
        replyTo: 'pa@erha.co.za',
      });
      if (!result.ok) throw new Error('Graph sendMail error: ' + (result.error || result.status));
      emailDispatched = true;
    } catch (e) {
      emailError = e.message;
      console.error('US-P3-012 customer send failed:', e.message);
    }

    // 6. activity_log — record both intent (status flip) and outcome (email)
    await supabase.from('activity_log').insert({
      action_type: 'rfq_sent_to_customer',
      entity_type: 'rfq',
      entity_id: rfq.id,
      operating_entity: rfq.operating_entity || null,
      metadata: {
        from_status: 'INTERNALLY_APPROVED',
        to_status: 'SENT_TO_CUSTOMER',
        customer_emails: customerEmails,
        override_to: overrideTo || null,
        email_dispatched: emailDispatched,
        email_error: emailError,
        pastel_pdf_attached: !!pastelPdf,
        pastel_pdf_filename: pastelPdf?.filename || null,
      },
    }).then(({ error: aerr }) => { if (aerr) console.error('activity_log insert failed:', aerr.message); });

    return res.status(200).json({
      success: true,
      rfq_status: 'SENT_TO_CUSTOMER',
      email_dispatched: emailDispatched,
      email_error: emailError,
      pastel_pdf_attached: !!pastelPdf,
      pastel_pdf_filename: pastelPdf?.filename || null,
      to: customerEmails,
    });
  } catch (e) {
    console.error('quote-send-to-customer handler error:', e);
    return res.status(500).json({ error: e.message || 'Unknown error' });
  }
}
