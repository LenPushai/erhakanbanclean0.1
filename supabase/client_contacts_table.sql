-- Client Contacts Table & Client Soft-Delete Columns
-- Run this in Supabase SQL Editor

-- Client contacts table
CREATE TABLE IF NOT EXISTS public.client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  department TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_contacts_client_id
  ON public.client_contacts (client_id);

ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_contacts_select" ON public.client_contacts
  FOR SELECT USING (true);
CREATE POLICY "client_contacts_insert" ON public.client_contacts
  FOR INSERT WITH CHECK (true);
CREATE POLICY "client_contacts_update" ON public.client_contacts
  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "client_contacts_delete" ON public.client_contacts
  FOR DELETE USING (true);

-- Add is_active and deactivation_reason to clients if not already present
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deactivation_reason TEXT;
