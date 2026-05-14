// TEMP debug route — diagnoses US-023.5 env-not-configured failure.
// Returns boolean presence flags only — no values are exposed.
// REMOVE in a follow-up commit immediately after the env issue is resolved.

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

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const supabaseKeyCount = Object.keys(process.env).filter(
    k => k.toUpperCase().includes('SUPABASE')
  ).length;
  const serviceRoleLikeCount = Object.keys(process.env).filter(
    k => k.toUpperCase().includes('SERVICE') && k.toUpperCase().includes('ROLE')
  ).length;

  return res.status(200).json({
    service_role_key_role_claim: jwtRoleClaim(process.env.SUPABASE_SERVICE_ROLE_KEY),
    anon_key_role_claim: jwtRoleClaim(process.env.VITE_SUPABASE_ANON_KEY),
    has_SUPABASE_URL: !!process.env.SUPABASE_URL,
    has_VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
    has_SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    has_VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY,
    has_APP_URL: !!process.env.APP_URL,
    has_VITE_APP_URL: !!process.env.VITE_APP_URL,
    has_RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    has_VITE_RESEND_API_KEY: !!process.env.VITE_RESEND_API_KEY,
    supabase_named_keys_total: supabaseKeyCount,
    service_role_named_keys_total: serviceRoleLikeCount,
    vercel_env: process.env.VERCEL_ENV || null,
    node_version: process.version,
  });
}
