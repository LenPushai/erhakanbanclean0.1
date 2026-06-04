import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.APP_URL || process.env.VITE_APP_URL;

// Stage 1 approver — see ADR-006 Stage 1 Signing Authority & Gatekeeper
// Amendment (2026-05-16). Sole approver = Dewald; no assignment-field
// routing, no automatic fallback. The Jeanic-authorised Hendrik fallback
// path is US-024c and not implemented here.
const STAGE_1_APPROVER = {
  email: 'dewald@erha.co.za',
  name: 'Dewald',
};

const headerStyle = 'background:linear-gradient(135deg,#1e3a5f,#2d5a8e);color:white;padding:20px;border-radius:8px 8px 0 0';
const bodyStyle = 'padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;font-family:Arial,sans-serif';
const footerStyle = 'margin-top:20px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center';
const footer = `<div style="${footerStyle}">ERHA · PUSH AI © 2026</div>`;
const infoRow = (label, value) => `<tr><td style="padding:4px 8px;font-weight:bold;color:#6b7280;width:140px">${label}</td><td style="padding:4px 8px;color:#1f2937">${value || '—'}</td></tr>`;

/**
 * Pastel PDF lookup. E5 (Batch 2) — loosened from strict
 * startsWith('quote-<num>') to "any PDF whose filename CONTAINS the
 * quote_number (case-insensitive)"; most-recently-uploaded wins via
 * order('created_at', DESC). Mirrors the same change in
 * api/quote-send-to-customer.js so the manager-approval email and the
 * customer-send email pick the same PDF for a given RFQ + quote_number.
 * The orphan helper in api/sign-submit.js intentionally kept strict
 * (dead code path).
 */
async function findPastelQuotePdf(supabase, rfqId, quoteNumber) {
  if (!quoteNumber) return null;
  const { data: rows, error } = await supabase
    .from('rfq_attachments')
    .select('file_name, file_path, created_at')
    .eq('rfq_id', rfqId)
    .ilike('file_name', '%.pdf')
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('[pastel-pdf] rfq_attachments lookup failed:', error.message);
    return null;
  }
  if (!rows || rows.length === 0) return null;
  const needle = String(quoteNumber).toLowerCase();
  const match = rows.find(r => String(r.file_name || '').toLowerCase().includes(needle));
  if (!match) return null;
  const { data: urlData } = supabase.storage.from('rfq-attachments').getPublicUrl(match.file_path);
  if (!urlData?.publicUrl) {
    console.warn(`[pastel-pdf] getPublicUrl returned no publicUrl for ${match.file_path}`);
    return null;
  }
  return { filename: match.file_name, url: urlData.publicUrl };
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

  try {
    const { rfq_id } = req.body || {};
    if (!rfq_id) return res.status(400).json({ error: 'rfq_id required' });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: rfq, error: rfqErr } = await supabase
      .from('rfqs').select('*, clients(company_name)').eq('id', rfq_id).maybeSingle();
    if (rfqErr || !rfq) {
      return res.status(404).json({ error: 'RFQ not found: ' + (rfqErr?.message || rfq_id) });
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error: insertErr } = await supabase.from('signature_tokens').insert({
      rfq_id: rfq.id,
      token,
      client_email: STAGE_1_APPROVER.email,
      client_name: STAGE_1_APPROVER.name,
      expires_at: expiresAt,
      is_valid: true,
      used_at: null,
      signature_stage: 'manager',
    });
    if (insertErr) return res.status(500).json({ error: 'Token insert failed: ' + insertErr.message });

    const link = `${APP_URL}/sign/${token}`;
    const sysNo = rfq.rfq_no || rfq.enq_number || 'RFQ';
    // E6 — surface both numbers when the customer has their own reference.
    const enq = rfq.client_rfq_number ? `${sysNo} (your ref: ${rfq.client_rfq_number})` : sysNo;
    const valueLine = rfq.quote_value_excl_vat
      ? 'R ' + Number(rfq.quote_value_excl_vat).toLocaleString('en-ZA') + ' excl VAT'
      : '-';
    const subject = `Quote Awaiting Your Sign-off - ${sysNo} (${rfq.quote_number || 'Quote'})`;
    const html = `<div style="max-width:600px;margin:0 auto">
      <div style="${headerStyle}"><h2 style="margin:0">Internal Quote Sign-off</h2></div>
      <div style="${bodyStyle}">
        <p style="margin-bottom:16px">A quote is ready for your internal sign-off before being sent to the customer.</p>
        <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
          ${infoRow('RFQ Number', enq)}
          ${infoRow('Quote Number', rfq.quote_number)}
          ${infoRow('Client', rfq.clients?.company_name || rfq.client_name)}
          ${infoRow('Description', rfq.description)}
          ${infoRow('Quote Value', valueLine)}
        </table>
        <div style="margin-top:24px;text-align:center">
          <a href="${link}" style="display:inline-block;background:#1d4ed8;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Review &amp; Sign Quote</a>
        </div>
        <p style="margin-top:20px;font-size:11px;color:#6b7280">Single-use link, expires in 7 days. Your sign-off is the final approval — once signed, the RFQ advances to the Order Won stage where the PO is captured.</p>
        ${footer}
      </div>
    </div>`;

    // Phase 1 — look up Pastel quote PDF by filename convention. If not
    // found, send the email without attachment (warning logged); the
    // digital signature flow is unchanged. See findPastelQuotePdf.
    const pastelPdf = await findPastelQuotePdf(supabase, rfq.id, rfq.quote_number);
    if (!pastelPdf) {
      console.warn(`[manager-approval-send] No Pastel PDF matching 'Quote-${rfq.quote_number}*.pdf' found in rfq_attachments for RFQ ${rfq.id}; sending email without attachment.`);
    }

    let emailDispatched = false;
    let emailError = null;
    try {
      const sendRes = await fetch(`${APP_URL}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: [STAGE_1_APPROVER.email],
          subject,
          html,
          attachments: pastelPdf ? [{ filename: pastelPdf.filename, path: pastelPdf.url }] : undefined,
        }),
      });
      const sendBody = await sendRes.json().catch(() => ({}));
      emailDispatched = sendRes.ok && sendBody.success;
      if (!emailDispatched) emailError = sendBody.error || `send-email returned ${sendRes.status}`;
    } catch (e) {
      emailError = e.message;
    }

    return res.status(200).json({
      success: true,
      token,
      email_dispatched: emailDispatched,
      email_error: emailError,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
