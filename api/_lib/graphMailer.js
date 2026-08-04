// Shared Microsoft Graph mailer — step 1 of the Resend → Graph swap.
//
// This module is Graph-only. It does not import, read, or know about any
// Resend env var or endpoint. Handlers will adopt it one at a time in
// subsequent steps; today it has no callers.
//
// Auth: OAuth2 client-credentials against
//   https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token
// with scope https://graph.microsoft.com/.default. The minted access token
// is cached in module scope and reused until ~5 minutes before its stated
// expiry — Vercel warm invocations share the cache, cold starts mint anew.
//
// Override: EMAIL_OVERRIDE_TO env (comma-separated list). When set, EVERY
// outbound send is rerouted there regardless of the caller's `to` field.
// When unset (or empty after trim), falls back to lenklopper03@gmail.com so
// a misconfigured prod can never accidentally email real recipients during
// the cutover. This is the single source of truth for the override — the
// per-handler TO_OVERRIDE constants in send-email.js, sign-submit.js,
// quote-send-to-customer.js, and cron/notify-completed-rfqs.js will be
// removed when those handlers are rewired through this module.
//
// Attachments: accepts the existing {filename, path} shape (path = URL).
// Each URL is fetched server-side, base64-encoded, and wrapped as a
// Graph fileAttachment. A failed fetch is logged and skipped — the send
// continues without that attachment rather than failing the whole email.
//
// Returns {ok, status, error?}. Throws only on hard auth failure (missing
// env vars or token-mint HTTP failure). Caller-visible recoverable failures
// (Graph sendMail HTTP error, network blip on the sendMail call) surface
// as {ok: false, status, error}.

const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';
const TOKEN_RENEW_BUFFER_MS = 5 * 60 * 1000; // refresh 5 minutes before expiry

// Module-scoped cache: { accessToken: string, expiresAt: ms-epoch }.
// Survives across warm Vercel invocations of the same function instance.
let cachedToken = null;

// EMAIL_OVERRIDE_TO is a testing switch. When it holds one or more
// addresses, every message reroutes there. When it is unset or blank this
// returns an empty list and the caller's real 	o is honoured.
//
// It previously fell back to a personal Gmail, which meant an unset
// variable silently swallowed all production mail. That is gone: there is
// no hidden destination, and an unresolvable recipient list fails loudly
// rather than going somewhere unexpected.
function readOverrideTo() {
  const raw = process.env.EMAIL_OVERRIDE_TO;
  if (!raw) return [];
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function toGraphRecipients(addresses) {
  return addresses.map((address) => ({ emailAddress: { address } }));
}

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt - now > TOKEN_RENEW_BUFFER_MS) {
    return cachedToken.accessToken;
  }

  const tenantId = process.env.GRAPH_TENANT_ID;
  const clientId = process.env.GRAPH_CLIENT_ID;
  const clientSecret = process.env.GRAPH_CLIENT_SECRET;
  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      'Graph auth not configured: GRAPH_TENANT_ID, GRAPH_CLIENT_ID, and GRAPH_CLIENT_SECRET must all be set.'
    );
  }

  const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Graph token mint failed: ${res.status} ${errText}`);
  }

  const tok = await res.json();
  const expiresInMs = (Number(tok.expires_in) || 3600) * 1000;
  cachedToken = {
    accessToken: tok.access_token,
    expiresAt: now + expiresInMs,
  };
  return cachedToken.accessToken;
}

async function buildGraphAttachment(att) {
  if (!att || !att.path || !att.filename) return null;
  try {
    const r = await fetch(att.path);
    if (!r.ok) {
      console.warn(
        `[graphMailer] attachment fetch failed: ${att.filename} (${r.status})`
      );
      return null;
    }
    const buf = Buffer.from(await r.arrayBuffer());
    return {
      '@odata.type': '#microsoft.graph.fileAttachment',
      name: att.filename,
      contentBytes: buf.toString('base64'),
    };
  } catch (e) {
    console.warn(
      `[graphMailer] attachment fetch threw: ${att.filename} — ${e.message}`
    );
    return null;
  }
}

function logAttempt({ to, subject, status, error }) {
  const record = {
    provider: 'graph',
    to,
    subject,
    status,
    timestamp: new Date().toISOString(),
  };
  if (error) record.error = error;
  // Structured JSON log so Vercel/ML pipelines can parse it; no existing
  // handler convention to mirror beyond plain console.error strings.
  console.log(JSON.stringify(record));
}

export async function sendMail({ to, subject, html, attachments, replyTo }) {
  const senderId = process.env.GRAPH_SENDER_USER_ID || 'noreply@erha.co.za';
  // Reroute only when the override actually holds addresses; otherwise
  // send to the recipients the caller asked for.
  const override = readOverrideTo();
  const intendedTo = (Array.isArray(to) ? to : [to])
    .map((s) => String(s || '').trim())
    .filter(Boolean);
  const overriddenTo = override.length > 0 ? override : intendedTo;

  if (overriddenTo.length === 0) {
    logAttempt({ to: [], subject, status: 'failed', error: 'no recipients resolved' });
    return { ok: false, status: 0, error: 'no recipients resolved' };
  }

  // Auth — the only hard-throw path per the spec.
  let token;
  try {
    token = await getAccessToken();
  } catch (e) {
    logAttempt({
      to: overriddenTo,
      subject,
      status: 'failed',
      error: e.message,
    });
    throw e;
  }

  // Attachments — best-effort. A null result means that attachment fetch
  // failed; filter them out and continue with whatever survived.
  let graphAttachments = [];
  if (Array.isArray(attachments) && attachments.length > 0) {
    const resolved = await Promise.all(attachments.map(buildGraphAttachment));
    graphAttachments = resolved.filter(Boolean);
  }

  const message = {
    subject,
    body: { contentType: 'HTML', content: html },
    toRecipients: toGraphRecipients(overriddenTo),
  };
  if (replyTo) {
    const replyList = Array.isArray(replyTo) ? replyTo : [replyTo];
    message.replyTo = toGraphRecipients(replyList);
  }
  if (graphAttachments.length > 0) {
    message.attachments = graphAttachments;
  }

  const sendUrl = `${GRAPH_API_BASE}/users/${encodeURIComponent(senderId)}/sendMail`;

  let res;
  try {
    res = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, saveToSentItems: false }),
    });
  } catch (e) {
    logAttempt({
      to: overriddenTo,
      subject,
      status: 'failed',
      error: `fetch threw: ${e.message}`,
    });
    return { ok: false, status: 0, error: e.message };
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    logAttempt({
      to: overriddenTo,
      subject,
      status: 'failed',
      error: `Graph sendMail ${res.status}: ${errText}`,
    });
    return { ok: false, status: res.status, error: errText };
  }

  logAttempt({ to: overriddenTo, subject, status: 'sent' });
  return { ok: true, status: res.status };
}
