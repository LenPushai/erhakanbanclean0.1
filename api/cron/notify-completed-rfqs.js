// US-P3-012: Cron-driven notification for RFQs that just transitioned to
// COMPLETED (via the DB trigger that fires when all linked jobs are
// invoiced — see supabase/usp3012_rfq_completed_trigger.sql).
//
// Idempotent: queries rfqs WHERE status='COMPLETED' AND completion_email_sent_at
// IS NULL, sends one email per row, then stamps completion_email_sent_at.
// A second .is('completion_email_sent_at', null) guard on the stamp UPDATE
// prevents double-sends if two cron invocations race.
//
// Auth: Vercel Cron sends Authorization: Bearer <CRON_SECRET>. Without auth,
// the endpoint would be publicly triggerable — a spam vector with our
// Resend key. CRON_SECRET must be set in Vercel env.
//
// HTML template mirrors src/emailService.ts:emailRfqCompleted — keep in sync
// if the template wording changes.

import { createClient } from '@supabase/supabase-js';
import { sendMail } from '../_lib/graphMailer.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

// Real completion-notification recipients per US-P3-012. The cutover-time
// override (EMAIL_OVERRIDE_TO env) lives in api/_lib/graphMailer.js — these
// addresses are recorded in the mailer's structured log but redirected to
// the override target until EMAIL_OVERRIDE_TO is cleared in Vercel env.
const COMPLETION_RECIPIENTS = ['hendrik@erha.co.za', 'pa@erha.co.za'];

const BATCH_LIMIT = 20;

function buildCompletedEmail(rfq) {
  const clientName = rfq.clients?.company_name || rfq.client_name || '—';
  const enq = rfq.rfq_no || rfq.enq_number || 'RFQ';
  const invoiceLine = rfq.invoice_value
    ? 'R ' + Number(rfq.invoice_value).toLocaleString('en-ZA')
    : '—';
  const subject = `RFQ ${enq} completed — ${clientName}`;
  const html = `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif">
    <div style="background:linear-gradient(135deg,#1e3a5f,#2d5a8e);color:white;padding:20px;border-radius:8px 8px 0 0">
      <h2 style="margin:0">RFQ Completed</h2>
    </div>
    <div style="padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
      <p style="margin-bottom:16px">Job for <strong>${clientName}</strong> has been fully invoiced. The RFQ is now closed out on the board.</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px">
        <tr><td style="padding:4px 8px;font-weight:bold;color:#6b7280;width:140px">RFQ Number</td><td style="padding:4px 8px">${rfq.rfq_no || '—'}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;color:#6b7280">Client</td><td style="padding:4px 8px">${clientName}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;color:#6b7280">Description</td><td style="padding:4px 8px">${rfq.description || '—'}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;color:#6b7280">Invoice Number</td><td style="padding:4px 8px">${rfq.invoice_number || '—'}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;color:#6b7280">Invoice Value</td><td style="padding:4px 8px">${invoiceLine}</td></tr>
      </table>
    </div>
  </div>`;
  return { subject, html };
}

export default async function handler(req, res) {
  if (!CRON_SECRET) {
    return res.status(500).json({ error: 'CRON_SECRET not configured server-side' });
  }
  if ((req.headers.authorization || '') !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Required env vars not configured server-side' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { data: rfqs, error: queryErr } = await supabase
      .from('rfqs')
      .select('id, rfq_no, enq_number, description, invoice_number, invoice_value, operating_entity, client_name, clients(company_name)')
      .eq('status', 'COMPLETED')
      .is('completion_email_sent_at', null)
      .limit(BATCH_LIMIT);

    if (queryErr) {
      return res.status(500).json({ error: 'rfqs query failed: ' + queryErr.message });
    }
    if (!rfqs || rfqs.length === 0) {
      return res.status(200).json({ sent: 0, failed: 0, note: 'no pending completion notifications' });
    }

    const sentIds = [];
    const failures = [];

    for (const rfq of rfqs) {
      try {
        const { subject, html } = buildCompletedEmail(rfq);
        const sendResult = await sendMail({
          to: COMPLETION_RECIPIENTS,
          subject,
          html,
          replyTo: 'pa@erha.co.za',
        });
        if (!sendResult.ok) {
          throw new Error('Graph sendMail error: ' + (sendResult.error || sendResult.status));
        }

        const { data: stamped, error: stampErr } = await supabase
          .from('rfqs')
          .update({ completion_email_sent_at: new Date().toISOString() })
          .eq('id', rfq.id)
          .is('completion_email_sent_at', null)
          .select('id');

        if (stampErr) {
          failures.push({ rfq_id: rfq.id, error: 'stamp failed: ' + stampErr.message });
          continue;
        }
        if (!stamped || stamped.length === 0) {
          // Another cron invocation stamped first — our send was a duplicate.
          // Don't log success or insert activity_log; just count it.
          failures.push({ rfq_id: rfq.id, error: 'raced — stamp already present, possible duplicate send' });
          continue;
        }

        await supabase.from('activity_log').insert({
          action_type: 'rfq_completion_email_sent',
          entity_type: 'rfq',
          entity_id: rfq.id,
          operating_entity: rfq.operating_entity || null,
          metadata: { trigger: 'cron', subject },
        }).then(({ error: aerr }) => { if (aerr) console.error('activity_log insert failed:', aerr.message); });

        sentIds.push(rfq.id);
      } catch (e) {
        failures.push({ rfq_id: rfq.id, error: e.message });
      }
    }

    return res.status(200).json({
      sent: sentIds.length,
      failed: failures.length,
      sent_ids: sentIds,
      failures: failures.length > 0 ? failures : undefined,
    });
  } catch (e) {
    console.error('cron notify-completed-rfqs error:', e);
    return res.status(500).json({ error: e.message || 'Unknown error' });
  }
}
