import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
    const { token } = req.body || {};
    if (!token || typeof token !== 'string' || token.length < 10) {
      return res.status(400).json({ error: 'Invalid sign link.' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: tk, error } = await supabase
      .from('signature_tokens')
      .select('rfq_id, signature_stage, client_email, client_name, used_at, is_valid, expires_at')
      .eq('token', token).maybeSingle();

    if (error) return res.status(500).json({ error: 'Token lookup failed: ' + error.message });
    if (!tk) return res.status(404).json({ error: 'This sign link is not recognised.' });
    if (tk.used_at) return res.status(400).json({ error: 'This sign link has already been used.' });
    if (tk.is_valid === false) return res.status(400).json({ error: 'This sign link has been invalidated. Please request a new one.' });
    if (new Date(tk.expires_at) < new Date()) {
      return res.status(400).json({ error: 'This sign link has expired. Please request a new one.' });
    }

    return res.status(200).json({
      rfq_id: tk.rfq_id,
      signature_stage: tk.signature_stage,
      client_email: tk.client_email,
      client_name: tk.client_name,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
