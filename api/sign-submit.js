// Server-side e-sign signature submission. Captures IP + user_agent server-side
// (tamper-resistant) and runs the Stage 1 cascade: insert signature, mark token
// used, flip RFQ status, create Stage 2 token, dispatch Stage 2 email, write
// activity_log. Stage 2 ('client') signatures are checkpoint-pending here — the
// 'client' branch returns 501 so the Stage 1 checkpoint isn't accidentally
// crossed. US-013 will extend this handler. See ADR-006 (Reconciliation Note +
// Lifecycle Integration Addendum).

import { createClient } from '@supabase/supabase-js';
import { sendMail } from './_lib/graphMailer.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// APP_URL was used only by the deleted sendCustomerSignEmail orphan (Stage-2
// customer cascade was removed 2026-05-18 with commit 8260780). Kept here
// in case any future server-side handler needs to build a /sign link; safe
// to remove in a follow-up if nothing else picks it up.
const APP_URL = process.env.APP_URL || process.env.VITE_APP_URL;

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

/**
 * Phase 1 — Pastel PDF lookup by filename convention.
 * Convention: file_name in rfq_attachments starts with 'Quote-<quote_number>'
 * (case-insensitive) and ends with '.pdf'. Returns the first match (or null
 * if none found). If multiple files match, the choice is undefined — the
 * operational expectation is one Pastel PDF per quote.
 *
 * If the convention changes, update BOTH api/sign-submit.js AND
 * api/manager-approval-send.js — this helper is duplicated across both
 * routes to keep each handler self-contained.
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
  // Real recipients: internal team (Hendrik + Jeanic). Recipient override
  // moved to api/_lib/graphMailer.js (EMAIL_OVERRIDE_TO env). During cutover
  // these addresses are recorded in the structured log but redirected to
  // the override target; clearing EMAIL_OVERRIDE_TO in Vercel env turns
  // this into the live notification.
  const result = await sendMail({
    to: ['hendrik@erha.co.za', 'pa@erha.co.za'],
    subject,
    html,
    replyTo: 'pa@erha.co.za',
  });
  if (!result.ok) {
    throw new Error('Graph sendMail error: ' + (result.error || result.status));
  }
  return result;
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
        signature_token_id: tk.id,
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
      // US-P3-012: Stage 1 (Hendrik internal sign-off) advances QUOTED -> INTERNALLY_APPROVED.
      // No customer cascade fires here — sending to the customer is a separate,
      // manual action gated behind Jeanic ("Send Quote to Customer" button on the
      // RFQ detail panel, which POSTs api/quote-send-to-customer.js and flips
      // INTERNALLY_APPROVED -> SENT_TO_CUSTOMER).
      //
      // Hardened 2026-05-29: rows-checked + return-on-error. The previous
      // implementation logged stErr and returned 200 success anyway, so a
      // CHECK-constraint rejection (INTERNALLY_APPROVED not yet allowed
      // because the migration hadn't been applied) or a .eq guard miss
      // (RFQ already past QUOTED) would still render the success card on
      // /sign. .select() forces RETURNING so we can inspect rows-affected;
      // the activity_log inserts and the 200 response only fire AFTER both
      // the error and zero-rows guards pass.
      const { data: updated, error: stErr } = await supabase
        .from('rfqs')
        .update({ status: 'INTERNALLY_APPROVED' })
        .eq('id', rfq.id).eq('status', 'QUOTED')
        .select();
      if (stErr) {
        return res.status(500).json({ success: false, error: stErr.message });
      }
      if (!updated?.length) {
        return res.status(409).json({ success: false, error: 'RFQ was not in QUOTED state; status not advanced.' });
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
        },
      }).then(({ error: aerr }) => { if (aerr) console.error('activity_log insert failed:', aerr.message); });

      await supabase.from('activity_log').insert({
        action_type: 'rfq_internally_approved',
        entity_type: 'rfq',
        entity_id: rfq.id,
        operating_entity: rfq.operating_entity || null,
        metadata: {
          signature_id: sig.id,
          signer_name: String(signer_name).trim(),
          from_status: 'QUOTED',
          to_status: 'INTERNALLY_APPROVED',
        },
      }).then(({ error: aerr }) => { if (aerr) console.error('activity_log insert failed:', aerr.message); });

      return res.status(200).json({
        success: true,
        stage: 'manager',
        signature_id: sig.id,
        rfq_status: 'INTERNALLY_APPROVED',
      });
    } else {
      // Stage 2 cascade: flip SENT_TO_CUSTOMER -> ACCEPTED, dispatch internal
      // "customer signed" notification, log activity, respond. No further token
      // — Stage 2 is terminal. emailOrderWon stays bound to handleSaveOrder
      // (PO + job creation), which is a separate downstream event.
      //
      // Hardened 2026-05-29 (twin of the manager-branch fix above): rows-
      // checked + return-on-error + status guard. Adds .eq('status',
      // 'SENT_TO_CUSTOMER') which the manager branch had implicitly but
      // this branch did not — without it, any RFQ in any state would be
      // flipped to ACCEPTED on a Stage 2 submit.
      const { data: updated, error: stErr } = await supabase
        .from('rfqs')
        .update({ status: 'ACCEPTED' })
        .eq('id', rfq.id).eq('status', 'SENT_TO_CUSTOMER')
        .select();
      if (stErr) {
        return res.status(500).json({ success: false, error: stErr.message });
      }
      if (!updated?.length) {
        return res.status(409).json({ success: false, error: 'RFQ was not in SENT_TO_CUSTOMER state; status not advanced.' });
      }

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
