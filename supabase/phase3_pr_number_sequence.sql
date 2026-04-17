-- Run this in Supabase SQL Editor BEFORE using the Purchase Requests feature
-- Creates the PR number auto-generation sequence and trigger

CREATE SEQUENCE IF NOT EXISTS public.pr_number_seq START 1;

ALTER TABLE public.purchase_requests ADD COLUMN IF NOT EXISTS pr_number TEXT UNIQUE;

CREATE OR REPLACE FUNCTION public.generate_pr_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pr_number IS NULL OR NEW.pr_number = '' THEN
    NEW.pr_number := 'PR-' || to_char(now(), 'YYYY') || '-' ||
                     lpad(nextval('public.pr_number_seq')::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_purchase_requests_pr_number ON public.purchase_requests;

CREATE TRIGGER trg_purchase_requests_pr_number
  BEFORE INSERT ON public.purchase_requests
  FOR EACH ROW EXECUTE FUNCTION public.generate_pr_number();
