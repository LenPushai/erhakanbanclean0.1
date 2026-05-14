// TEMP debug route — diagnoses US-023.5 env + service-role connectivity.
// Returns boolean presence flags + JWT role claims + connectivity probes.
// REMOVE in a follow-up commit immediately after the issue is resolved.

import { createClient } from '@supabase/supabase-js';

function jwtRoleClaim(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return 'not-a-jwt';
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    return payload.role || 'unknown';
  } catch {
    return 'decode-error';
  }
}

function jwtRef(token) {
  // 'ref' (project ref) from JWT payload — identifies which Supabase project
  // the key was issued for. Comparing this against the URL host detects a
  // cross-project key/URL mismatch.
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    return payload.ref || null;
  } catch {
    return null;
  }
}

function urlHost(u) {
  if (!u) return null;
  try { return new URL(u).host; } catch { return 'parse-error'; }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Probe A: SELECT count via supabase-js client (same path as the routes)
  let probeA = { error: 'not_attempted' };
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { count, error } = await sb
        .from('signature_tokens')
        .select('*', { count: 'exact', head: true });
      probeA = error ? { error: error.message } : { count };
    } catch (e) {
      probeA = { error: e.message };
    }
  }

  // Probe B: raw PostgREST fetch with manual Authorization header
  let probeB = { error: 'not_attempted' };
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/signature_tokens?select=count`, {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: 'count=exact',
        },
      });
      const text = await r.text();
      probeB = { status: r.status, content_range: r.headers.get('content-range'), body_first_200: text.slice(0, 200) };
    } catch (e) {
      probeB = { error: e.message };
    }
  }

  return res.status(200).json({
    service_role_key_role_claim: jwtRoleClaim(SUPABASE_SERVICE_ROLE_KEY),
    service_role_key_project_ref: jwtRef(SUPABASE_SERVICE_ROLE_KEY),
    supabase_url_host: urlHost(SUPABASE_URL),
    has_SUPABASE_URL: !!process.env.SUPABASE_URL,
    has_VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
    has_SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    has_APP_URL: !!process.env.APP_URL,
    has_RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    probe_a_supabase_js_count: probeA,
    probe_b_raw_postgrest: probeB,
    vercel_env: process.env.VERCEL_ENV || null,
    node_version: process.version,
  });
}
