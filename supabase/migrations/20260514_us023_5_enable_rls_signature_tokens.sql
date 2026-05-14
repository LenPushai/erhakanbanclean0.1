-- US-023.5 — Enable Row-Level Security on signature_tokens
--
-- Closes the security finding from US-023 Phase 2 audit: signature_tokens
-- had RLS disabled, allowing the public anon key (shipped in every client
-- bundle) to enumerate valid signing tokens via PostgREST. This migration
-- enables RLS with no anon-readable policies. The serverless routes
-- (api/sign-validate.js, api/sign-tokens-list.js, api/manager-approval-send.js,
-- and the refactored api/sign-submit.js) use the SUPABASE_SERVICE_ROLE_KEY,
-- which bypasses RLS, to handle all legitimate signature_tokens access.
--
-- Apply order: run this AFTER the deploy carrying the new server routes
-- has shipped to production AND a smoke test confirms Stage 1 + Stage 2
-- signing still works via the new routes. Running this before the deploy
-- would break the existing anon-based code paths.

ALTER TABLE public.signature_tokens ENABLE ROW LEVEL SECURITY;

-- No policies attached. Anon role is denied all direct access to
-- signature_tokens. Only service-role-authenticated server routes can
-- read or write this table.
