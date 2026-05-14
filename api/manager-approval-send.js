import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.VITE_APP_URL;

const headerStyle = 'background:linear-gradient(135deg,#1e3a5f,#2d5a8e);color:white;padding:20px;border-radius:8px 8px 0 0';
const bodyStyle = 'padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;font-family:Arial,sans-serif';
const footerStyle = 'margin-top:20px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center';
const footer = `<div style="${footerStyle}">ERHA · PUSH AI © 2026</div>`;
const infoRow = (label, value) => `<tr><td style="padding:4px 8px;font-weight:bold;color:#6b7280;width:140px">${label}</td><td style="padding:4px 8px;color:#1f2937">${value || '—'}</td></tr>`;

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
      client_email: 'hendrik@erha.co.za',
      client_name: 'Hendrik',
      expires_at: expiresAt,
      is_valid: true,
      used_at: null,
      signature_stage: 'manager',
    });
    if (insertErr) return res.status(500).json({ error: 'Token insert failed: ' + insertErr.message });

    const link = `${APP_URL}/sign/${token}`;
    const enq = rfq.rfq_no || rfq.enq_number || 'RFQ';
    const valueLine = rfq.quote_value_excl_vat
      ? 'R ' + Number(rfq.quote_value_excl_vat).toLocaleString('en-ZA') + ' excl VAT'
      : '-';
    const subject = `Quote Awaiting Your Sign-off - ${enq} (${rfq.quote_number || 'Quote'})`;
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
        <p style="margin-top:20px;font-size:11px;color:#6b7280">Single-use link, expires in 7 days. Once signed, the quote is automatically emailed to the customer for their acceptance.</p>
        ${footer}
      </div>
    </div>`;

    let emailDispatched = false;
    let emailError = null;
    try {
      const sendRes = await fetch(`${APP_URL}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: ['hendrik@erha.co.za'], subject, html }),
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
