-- Baseline captured 2026-05-16 via introspection of project lvaqqqyjqtguozmdjmfn.
-- Idempotent — apply before any Phase 2 remediation. Mirrors live schema exactly,
-- including the redundant idx_tokens_token index (dropped in Phase 2 finding E).
-- ENABLE ROW LEVEL SECURITY here records the US-023.5 outcome so a fresh project
-- starts in the secured state.

-- ----------------------------------------------------------------------------
-- signature_tokens — single-use signing tokens, one per stage per RFQ
-- ----------------------------------------------------------------------------
create table if not exists public.signature_tokens (
  id              uuid primary key default gen_random_uuid(),
  rfq_id          uuid not null,
  token           varchar not null,
  client_email    varchar not null,
  client_name     varchar,
  expires_at      timestamptz not null,
  used_at         timestamptz,
  is_valid        boolean default true,
  created_at      timestamptz default now(),
  signature_stage text default 'manager',
  constraint signature_tokens_token_key unique (token)
);

create index if not exists idx_tokens_rfq   on public.signature_tokens (rfq_id);
create index if not exists idx_tokens_token on public.signature_tokens (token);
-- ^ idx_tokens_token is redundant with signature_tokens_token_key (UNIQUE creates
--   its own unique btree). Captured here because it exists live; dropped by
--   Phase 2 finding E.

alter table public.signature_tokens enable row level security;
-- ^ Records the US-023.5 RLS lockdown (commit 67d22fc, 2026-05-15). No policies
--   attached — service role bypasses RLS; anon is blocked from SELECT.

-- ----------------------------------------------------------------------------
-- quote_signatures — completed signature records
-- ----------------------------------------------------------------------------
create table if not exists public.quote_signatures (
  id                uuid primary key default gen_random_uuid(),
  rfq_id            uuid,
  quote_number      varchar,
  signer_name       varchar not null,
  signer_email      varchar not null,
  signer_title      varchar,
  signer_company    varchar,
  signature_data    text,
  signature_type    varchar default 'click',
  signed_at         timestamptz default now(),
  ip_address        varchar,
  user_agent        text,
  quote_total       numeric,
  quote_description text,
  status            varchar default 'SIGNED',
  created_at        timestamptz default now(),
  signature_stage   varchar default 'client'
);

create index if not exists idx_signatures_rfq   on public.quote_signatures (rfq_id);
create index if not exists idx_signatures_quote on public.quote_signatures (quote_number);

alter table public.quote_signatures enable row level security;
-- ^ RLS was already on at audit time (correctly locked down at table creation).
--   Existing 4 policies (with 2 duplicate pairs) are NOT captured in this
--   baseline — they ship as their own dedup migration when US-023.5 follow-up #1
--   is picked up. Baseline records the table being in the RLS-enabled state.
