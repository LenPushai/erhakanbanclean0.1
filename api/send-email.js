import { sendMail } from './_lib/graphMailer.js';

// Template dict kept for callers that POST {template, data}. None of the
// current frontend or server-side callers use it (they all send raw
// {subject, html}); left in place for a later cleanup so this rewire
// stays purely an integration change.
const templates = {
  rfq_received: (d) => ({
    subject: `New RFQ Received - ${d.rfq_number || 'ENQ'}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden"><div style="background:#1d3461;color:white;padding:20px 24px"><h2 style="margin:0">ERHA Operations</h2><p style="margin:4px 0 0;opacity:.8">New Enquiry Received</p></div><div style="padding:24px"><p><strong>ENQ Number:</strong> ${d.rfq_number || 'N/A'}</p><p><strong>Client:</strong> ${d.client_name || 'N/A'}</p><p><strong>Description:</strong> ${d.description || 'N/A'}</p><p><strong>Required By:</strong> ${d.required_date || 'N/A'}</p></div><div style="background:#f3f4f6;padding:12px 24px;font-size:12px;color:#6b7280">ERHA Fabrication &amp; Construction | PUSH AI</div></div>`
  }),
  estimator_assigned: (d) => ({
    subject: `RFQ Assigned to Quoter - ${d.rfq_number || 'ENQ'}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden"><div style="background:#1d3461;color:white;padding:20px 24px"><h2 style="margin:0">ERHA Operations</h2><p style="margin:4px 0 0;opacity:.8">Quoter Assigned</p></div><div style="padding:24px"><p><strong>ENQ Number:</strong> ${d.rfq_number || 'N/A'}</p><p><strong>Client:</strong> ${d.client_name || 'N/A'}</p><p><strong>Assigned To:</strong> ${d.quoter_name || 'N/A'}</p><p><strong>Description:</strong> ${d.description || 'N/A'}</p></div><div style="background:#f3f4f6;padding:12px 24px;font-size:12px;color:#6b7280">ERHA Fabrication &amp; Construction | PUSH AI</div></div>`
  }),
  quote_ready: (d) => ({
    subject: `Quote Ready for Review - ${d.rfq_number || 'ENQ'}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden"><div style="background:#1d3461;color:white;padding:20px 24px"><h2 style="margin:0">ERHA Operations</h2><p style="margin:4px 0 0;opacity:.8">Quote Submitted</p></div><div style="padding:24px"><p><strong>ENQ Number:</strong> ${d.rfq_number || 'N/A'}</p><p><strong>Quote Number:</strong> ${d.quote_number || 'N/A'}</p><p><strong>Client:</strong> ${d.client_name || 'N/A'}</p><p><strong>Value (excl VAT):</strong> R ${d.quote_value_excl || '0.00'}</p><p style="color:#1d3461"><strong>Action Required:</strong> Jeanic to review and send to customer.</p></div><div style="background:#f3f4f6;padding:12px 24px;font-size:12px;color:#6b7280">ERHA Fabrication &amp; Construction | PUSH AI</div></div>`
  }),
  quote_signoff_request: (d) => ({
    subject: `Sign-off Required on Quote - ${d.rfq_number || 'ENQ'}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden"><div style="background:#4db848;color:white;padding:20px 24px"><h2 style="margin:0">ERHA Operations</h2><p style="margin:4px 0 0;opacity:.9">Quote Sign-off Requested</p></div><div style="padding:24px"><p>Hi <strong>${d.quoter_name || 'Quoter'}</strong>,</p><p>Jeanic has requested your sign-off on the following quote before it is sent to the client:</p><p><strong>ENQ Number:</strong> ${d.rfq_number || 'N/A'}</p><p><strong>Quote Number:</strong> ${d.quote_number || 'N/A'}</p><p><strong>Client:</strong> ${d.client_name || 'N/A'}</p><p><strong>Value (excl VAT):</strong> R ${d.quote_value_excl || '0.00'}</p><p style="color:#d97706"><strong>Please reply to this email to confirm your sign-off.</strong></p></div><div style="background:#f3f4f6;padding:12px 24px;font-size:12px;color:#6b7280">ERHA Fabrication &amp; Construction | PUSH AI</div></div>`
  }),
  quote_signoff_confirmed: (d) => ({
    subject: `Quote Signed Off - Ready to Send to Client - ${d.rfq_number || 'ENQ'}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden"><div style="background:#4db848;color:white;padding:20px 24px"><h2 style="margin:0">ERHA Operations</h2><p style="margin:4px 0 0;opacity:.9">Quote Approved - Ready to Send</p></div><div style="padding:24px"><p>Hi <strong>Jeanic</strong>,</p><p><strong>${d.quoter_name || 'The quoter'}</strong> has signed off on the quote. You can now send it to the client.</p><p><strong>ENQ Number:</strong> ${d.rfq_number || 'N/A'}</p><p><strong>Quote Number:</strong> ${d.quote_number || 'N/A'}</p><p><strong>Client:</strong> ${d.client_name || 'N/A'}</p><p style="color:#1d3461"><strong>Action Required:</strong> Move RFQ to Sent to Customer and send the quote PDF.</p></div><div style="background:#f3f4f6;padding:12px 24px;font-size:12px;color:#6b7280">ERHA Fabrication &amp; Construction | PUSH AI</div></div>`
  }),
  order_won: (d) => ({
    subject: `Order Won! - ${d.rfq_number || 'ENQ'}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden"><div style="background:#4db848;color:white;padding:20px 24px"><h2 style="margin:0">ERHA Operations</h2><p style="margin:4px 0 0;opacity:.9">Order Received!</p></div><div style="padding:24px"><p><strong>ENQ Number:</strong> ${d.rfq_number || 'N/A'}</p><p><strong>Client:</strong> ${d.client_name || 'N/A'}</p><p><strong>Order Number:</strong> ${d.order_number || 'N/A'}</p><p><strong>Value (excl VAT):</strong> R ${d.quote_value_excl || '0.00'}</p></div><div style="background:#f3f4f6;padding:12px 24px;font-size:12px;color:#6b7280">ERHA Fabrication &amp; Construction | PUSH AI</div></div>`
  }),
  job_created: (d) => ({
    subject: `New Job Created - ${d.job_number || 'JOB'}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden"><div style="background:#1d3461;color:white;padding:20px 24px"><h2 style="margin:0">ERHA Operations</h2><p style="margin:4px 0 0;opacity:.8">Job Created</p></div><div style="padding:24px"><p><strong>Job Number:</strong> ${d.job_number || 'N/A'}</p><p><strong>Client:</strong> ${d.client_name || 'N/A'}</p><p><strong>Description:</strong> ${d.description || 'N/A'}</p><p><strong>ENQ Reference:</strong> ${d.rfq_number || 'N/A'}</p></div><div style="background:#f3f4f6;padding:12px 24px;font-size:12px;color:#6b7280">ERHA Fabrication &amp; Construction | PUSH AI</div></div>`
  }),
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { to, template, data, subject: rawSubject, html: rawHtml, reply_to: rawReplyTo, attachments: rawAttachments } = req.body || {};
    // Recipient override moved into api/_lib/graphMailer.js (EMAIL_OVERRIDE_TO
    // env, with lenklopper03@gmail.com safety fallback). The caller's real
    // `to` is passed through here unchanged — the mailer is the single point
    // of truth for cutover-time redirection.
    if (!to) return res.status(400).json({ error: 'Missing to' });
    let subject, html;
    if (rawSubject && rawHtml) {
      subject = rawSubject;
      html = rawHtml;
    } else {
      if (!template) return res.status(400).json({ error: 'Missing template or subject/html' });
      const templateFn = templates[template];
      if (!templateFn) return res.status(400).json({ error: 'Unknown template: ' + template });
      ({ subject, html } = templateFn(data || {}));
    }
    const result = await sendMail({
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      attachments: Array.isArray(rawAttachments) && rawAttachments.length > 0 ? rawAttachments : undefined,
      replyTo: rawReplyTo || 'pa@erha.co.za',
    });
    if (result.ok) {
      res.status(200).json({ success: true });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}