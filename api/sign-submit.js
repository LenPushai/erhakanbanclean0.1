// Server-side e-sign signature submission. Captures IP + user_agent server-side
// (tamper-resistant) and runs the Stage 1 cascade: insert signature, mark token
// used, flip RFQ status, create Stage 2 token, dispatch Stage 2 email, write
// activity_log. Stage 2 ('client') signatures are checkpoint-pending here — the
// 'client' branch returns 501 so the Stage 1 checkpoint isn't accidentally
// crossed. US-013 will extend this handler. See ADR-006 (Reconciliation Note +
// Lifecycle Integration Addendum).

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const APP_URL = process.env.VITE_APP_URL;
const RESEND_API_KEY = process.env.VITE_RESEND_API_KEY || 're_Q3RKYakG_9yGoARH977FNLhwF2rG9Y8vk';
const FROM_EMAIL = 'ERHA Operations <onboarding@resend.dev>';

const BRAND_FROM_ENTITY = {
  ERHA_FC: 'ERHA Fabrication & Construction',
  // TODO: confirm S&S brand expansion with client — guess only
  ERHA_SS: 'ERHA Steel & Stainless',
};

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.socket?.remoteAddress || req.connection?.remoteAddress || null;
}

async function sendCustomerSignEmail({ rfq, token }) {
  if (!APP_URL) throw new Error('VITE_APP_URL not configured server-side; cannot build sign link.');
  const link = `${APP_URL}/sign/${token}`;
  const enq = rfq.rfq_no || rfq.enq_number || 'RFQ';
  const valueLine = rfq.quote_value_excl_vat
    ? 'R ' + Number(rfq.quote_value_excl_vat).toLocaleString('en-ZA') + ' excl VAT'
    : '-';
  const subject = `Quote Ready for Your Signature - ${enq} (${rfq.quote_number || 'Quote'})`;
  const html = `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif">
    <div style="background:linear-gradient(135deg,#1e3a5f,#2d5a8e);color:white;padding:20px;border-radius:8px 8px 0 0">
      <h2 style="margin:0">Quote Ready for Signature</h2>
    </div>
    <div style="padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
      <p>Your quotation has been prepared and signed off internally. Please review and sign to accept.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px;margin-top:12px">
        <tr><td style="padding:4px 8px;font-weight:bold;color:#6b7280;width:140px">RFQ</td><td style="padding:4px 8px">${enq}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;color:#6b7280">Quote</td><td style="padding:4px 8px">${rfq.quote_number || '-'}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;color:#6b7280">Description</td><td style="padding:4px 8px">${rfq.description || '-'}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;color:#6b7280">Quote value</td><td style="padding:4px 8px">${valueLine}</td></tr>
      </table>
      <div style="margin-top:24px;text-align:center">
        <a href="${link}" style="display:inline-block;background:#1d4ed8;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Review &amp; Sign Quote</a>
      </div>
      <p style="margin-top:20px;font-size:11px;color:#6b7280">Single-use link, expires in 7 days.</p>
    </div>
  </div>`;
  // TEMP override mirrored from api/send-email.js — REMOVE with US-014b before Monday.
  const to = ['lenklopper03@gmail.com'];
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error('Resend error: ' + (err.message || response.status));
  }
  return await response.json();
}

async function sendCustomerSignedNotification({ rfq, signerName }) {
  const enq = rfq.rfq_no || rfq.enq_number || 'RFQ';
  const valueLine = rfq.quote_value_excl_vat
    ? 'R ' + Number(rfq.quote_value_excl_vat).toLocaleString('en-ZA') + ' excl VAT'
    : '-';
  const subject = `Customer Accepted Quote - ${enq} (${rfq.quote_number || 'Quote'})`;
  const html = `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif">
    <div style="background:linear-gradient(135deg,#065f46,#10b981);color:white;padding:20px;border-radius:8px 8px 0 0">
      <h2 style="margin:0">Customer Has Accepted the Quote</h2>
    </div>
    <div style="padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
      <p>The customer has reviewed and signed the quotation. Awaiting PO capture and job creation.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px;margin-top:12px">
        <tr><td style="padding:4px 8px;font-weight:bold;color:#6b7280;width:140px">RFQ</td><td style="padding:4px 8px">${enq}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;color:#6b7280">Quote</td><td style="padding:4px 8px">${rfq.quote_number || '-'}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;color:#6b7280">Client</td><td style="padding:4px 8px">${rfq.clients?.company_name || '-'}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;color:#6b7280">Description</td><td style="padding:4px 8px">${rfq.description || '-'}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;color:#6b7280">Quote value</td><td style="padding:4px 8px">${valueLine}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;color:#6b7280">Signed by</td><td style="padding:4px 8px">${signerName || '-'}</td></tr>
      </table>
      <p style="margin-top:16px;color:#6b7280;font-size:13px"><strong>Next step:</strong> capture the customer PO in the RFQ detail panel and click "Save Order - Move to Order Won" to create the job.</p>
    </div>
  </div>`;
  // TEMP override mirrored from api/send-email.js — REMOVE with US-014b before Monday.
  const to = ['lenklopper03@gmail.com'];
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error('Resend error: ' + (err.message || response.status));
  }
  return await response.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Supabase env not configured server-side.' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    const { token, signer_name, signer_title, signer_company, signature_type, signature_data } = req.body || {};
    if (!token) return res.status(400).json({ error: 'token required' });
    if (!signer_name || !String(signer_name).trim()) {
      return res.status(400).json({ error: 'signer_name required' });
    }

    // 1. Validate token
    const { data: tk, error: tkErr } = await supabase
      .from('signature_tokens').select('*').eq('token', token).maybeSingle();
    if (tkErr) return res.status(500).json({ error: 'Token lookup failed: ' + tkErr.message });
    if (!tk) return res.status(404).json({ error: 'This sign link is not recognised.' });
    if (tk.used_at) return res.status(400).json({ error: 'This sign link has already been used.' });
    if (tk.is_valid === false) return res.status(400).json({ error: 'This sign link has been invalidated.' });
    if (new Date(tk.expires_at) < new Date()) {
      return res.status(400).json({ error: 'This sign link has expired.' });
    }

    if (tk.signature_stage !== 'manager' && tk.signature_stage !== 'client') {
      return res.status(400).json({ error: 'Unknown signature stage: ' + tk.signature_stage });
    }
    const stage = tk.signature_stage;

    // 2. Load RFQ for denormalised fields
    const { data: rfq, error: rfqErr } = await supabase
      .from('rfqs').select('*, clients(company_name)').eq('id', tk.rfq_id).maybeSingle();
    if (rfqErr || !rfq) {
      return res.status(500).json({ error: 'RFQ lookup failed: ' + (rfqErr?.message || 'not found') });
    }

    const ip = getClientIp(req);
    const ua = req.headers['user-agent'] || null;
    // Stage 1 derives signer_company from operating_entity (the manager signs
    // on behalf of ERHA). Stage 2 takes signer_company from the customer's
    // form input (their own company) — may be null.
    const resolvedCompany = stage === 'manager'
      ? (BRAND_FROM_ENTITY[rfq.operating_entity] || BRAND_FROM_ENTITY.ERHA_FC)
      : (signer_company ? String(signer_company).trim() : null);

    // 3. Insert quote_signatures
    const { data: sig, error: sigErr } = await supabase
      .from('quote_signatures').insert({
        rfq_id: tk.rfq_id,
        quote_number: rfq.quote_number || null,
        signer_name: String(signer_name).trim(),
        signer_email: tk.client_email,
        signer_title: signer_title ? String(signer_title).trim() : null,
        signer_company: resolvedCompany,
        signature_data: signature_data || null,
        signature_type: signature_type === 'drawn' ? 'drawn' : 'click',
        ip_address: ip,
        user_agent: ua,
        quote_total: rfq.quote_value_excl_vat ?? null,
        quote_description: rfq.description || null,
        status: 'SIGNED',
        signature_stage: stage,
      }).select('id').single();
    if (sigErr) return res.status(500).json({ error: 'Signature insert failed: ' + sigErr.message });

    // 4. Mark token used
    const { error: tkUpErr } = await supabase
      .from('signature_tokens').update({ used_at: new Date().toISOString() }).eq('id', tk.id);
    if (tkUpErr) console.error('token update failed:', tkUpErr.message);

    if (stage === 'manager') {
      // Stage 1 cascade: flip QUOTED -> SENT_TO_CUSTOMER, create Stage 2 token,
      // dispatch Stage 2 email, log activity, respond.
      const { error: stErr } = await supabase
        .from('rfqs').update({ status: 'SENT_TO_CUSTOMER' }).eq('id', rfq.id);
      if (stErr) console.error('rfq status flip failed:', stErr.message);

      const stage2Token = crypto.randomUUID();
      const customerEmail = rfq.contact_email || null;
      const stage2ExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      let stage2TokenId = null;
      let stage2EmailDispatched = false;
      let stage2DispatchError = null;
      if (customerEmail) {
        const { data: t2, error: t2Err } = await supabase
          .from('signature_tokens').insert({
            rfq_id: rfq.id,
            token: stage2Token,
            client_email: customerEmail,
            client_name: rfq.contact_person || null,
            expires_at: stage2ExpiresAt,
            is_valid: true,
            used_at: null,
            signature_stage: 'client',
          }).select('id').single();
        if (t2Err) {
          console.error('Stage 2 token insert failed:', t2Err.message);
        } else {
          stage2TokenId = t2.id;
          try {
            await sendCustomerSignEmail({ rfq, token: stage2Token });
            stage2EmailDispatched = true;
          } catch (e) {
            stage2DispatchError = e.message;
            console.error('Stage 2 email dispatch failed:', e.message);
          }
        }
      } else {
        console.warn('No contact_email on RFQ ' + rfq.id + '; Stage 2 token + email skipped.');
      }

      await supabase.from('activity_log').insert({
        action_type: 'quote_signed_stage_1',
        entity_type: 'rfq',
        entity_id: rfq.id,
        operating_entity: rfq.operating_entity || null,
        metadata: {
          signature_id: sig.id,
          rfq_id: rfq.id,
          signature_stage: 'manager',
          signer_name: String(signer_name).trim(),
          signer_email: tk.client_email,
          signature_type: signature_type === 'drawn' ? 'drawn' : 'click',
          stage_2_token_id: stage2TokenId,
          stage_2_email_dispatched: stage2EmailDispatched,
          stage_2_dispatch_error: stage2DispatchError,
        },
      }).then(({ error: aerr }) => { if (aerr) console.error('activity_log insert failed:', aerr.message); });

      return res.status(200).json({
        success: true,
        stage: 'manager',
        signature_id: sig.id,
        stage_2_token_created: !!stage2TokenId,
        stage_2_email_dispatched: stage2EmailDispatched,
        stage_2_dispatch_error: stage2DispatchError,
      });
    } else {
      // Stage 2 cascade: flip SENT_TO_CUSTOMER -> ACCEPTED, dispatch internal
      // "customer signed" notification, log activity, respond. No further token
      // — Stage 2 is terminal. emailOrderWon stays bound to handleSaveOrder
      // (PO + job creation), which is a separate downstream event.
      const { error: stErr } = await supabase
        .from('rfqs').update({ status: 'ACCEPTED' }).eq('id', rfq.id);
      if (stErr) console.error('rfq status flip failed:', stErr.message);

      let internalEmailDispatched = false;
      let internalEmailError = null;
      try {
        await sendCustomerSignedNotification({ rfq, signerName: String(signer_name).trim() });
        internalEmailDispatched = true;
      } catch (e) {
        internalEmailError = e.message;
        console.error('Customer-signed notification failed:', e.message);
      }

      await supabase.from('activity_log').insert({
        action_type: 'quote_signed_stage_2',
        entity_type: 'rfq',
        entity_id: rfq.id,
        operating_entity: rfq.operating_entity || null,
        metadata: {
          signature_id: sig.id,
          rfq_id: rfq.id,
          signature_stage: 'client',
          signer_name: String(signer_name).trim(),
          signer_email: tk.client_email,
          signature_type: signature_type === 'drawn' ? 'drawn' : 'click',
          internal_email_dispatched: internalEmailDispatched,
          internal_email_error: internalEmailError,
        },
      }).then(({ error: aerr }) => { if (aerr) console.error('activity_log insert failed:', aerr.message); });

      return res.status(200).json({
        success: true,
        stage: 'client',
        signature_id: sig.id,
        internal_email_dispatched: internalEmailDispatched,
        internal_email_error: internalEmailError,
      });
    }
  } catch (e) {
    console.error('sign-submit handler error:', e);
    return res.status(500).json({ error: e.message || 'Unknown error' });
  }
}
