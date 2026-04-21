-- =====================================================================
-- CR-1: Dual-entity support (ERHA_FC / ERHA_SS)
-- File:  supabase/cr1_dual_entity.sql
-- Date:  2026-04-17
--
-- Adds operating_entity to operational tables, backfills 'ERHA_FC',
-- indexes, per-entity sequences, and entity-aware number-generation
-- triggers. Shared reference tables (clients, client_contacts,
-- suppliers) are intentionally excluded.
--
-- Number formats produced by this migration:
--   Jobs:  JOB-FC26-0001 / JOB-SS26-0001
--   PRs:   PR-FC26-0001  / PR-SS26-0001
--   POs:   PO-FC26-0001  / PO-SS26-0001
--   GRVs:  GRV-FC26-0001 / GRV-SS26-0001
--
-- NOTE: Sequence continuity is preserved — FC sequences are renamed
-- from the existing job_number_seq / pr_number_seq / po_number_seq, so
-- the next FC number increments from the current value. Existing rows
-- retain their previously-generated numbers (no rewrite).
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1) operating_entity column on operational tables
-- ---------------------------------------------------------------------
ALTER TABLE public.jobs                    ADD COLUMN IF NOT EXISTS operating_entity TEXT NOT NULL DEFAULT 'ERHA_FC' CHECK (operating_entity IN ('ERHA_FC', 'ERHA_SS'));
ALTER TABLE public.rfqs                    ADD COLUMN IF NOT EXISTS operating_entity TEXT NOT NULL DEFAULT 'ERHA_FC' CHECK (operating_entity IN ('ERHA_FC', 'ERHA_SS'));
ALTER TABLE public.purchase_requests       ADD COLUMN IF NOT EXISTS operating_entity TEXT NOT NULL DEFAULT 'ERHA_FC' CHECK (operating_entity IN ('ERHA_FC', 'ERHA_SS'));
ALTER TABLE public.purchase_orders         ADD COLUMN IF NOT EXISTS operating_entity TEXT NOT NULL DEFAULT 'ERHA_FC' CHECK (operating_entity IN ('ERHA_FC', 'ERHA_SS'));
ALTER TABLE public.goods_received_vouchers ADD COLUMN IF NOT EXISTS operating_entity TEXT NOT NULL DEFAULT 'ERHA_FC' CHECK (operating_entity IN ('ERHA_FC', 'ERHA_SS'));
ALTER TABLE public.supplier_invoices       ADD COLUMN IF NOT EXISTS operating_entity TEXT NOT NULL DEFAULT 'ERHA_FC' CHECK (operating_entity IN ('ERHA_FC', 'ERHA_SS'));
ALTER TABLE public.stock_items             ADD COLUMN IF NOT EXISTS operating_entity TEXT NOT NULL DEFAULT 'ERHA_FC' CHECK (operating_entity IN ('ERHA_FC', 'ERHA_SS'));
ALTER TABLE public.stock_transactions      ADD COLUMN IF NOT EXISTS operating_entity TEXT NOT NULL DEFAULT 'ERHA_FC' CHECK (operating_entity IN ('ERHA_FC', 'ERHA_SS'));
ALTER TABLE public.stock_counts            ADD COLUMN IF NOT EXISTS operating_entity TEXT NOT NULL DEFAULT 'ERHA_FC' CHECK (operating_entity IN ('ERHA_FC', 'ERHA_SS'));
ALTER TABLE public.activity_log            ADD COLUMN IF NOT EXISTS operating_entity TEXT NOT NULL DEFAULT 'ERHA_FC' CHECK (operating_entity IN ('ERHA_FC', 'ERHA_SS'));

-- ---------------------------------------------------------------------
-- 2) Backfill — explicit, idempotent safety net
--    (redundant when the NOT NULL DEFAULT above already applied, but
--     harmless to re-run)
-- ---------------------------------------------------------------------
UPDATE public.jobs                    SET operating_entity = 'ERHA_FC' WHERE operating_entity IS NULL;
UPDATE public.rfqs                    SET operating_entity = 'ERHA_FC' WHERE operating_entity IS NULL;
UPDATE public.purchase_requests       SET operating_entity = 'ERHA_FC' WHERE operating_entity IS NULL;
UPDATE public.purchase_orders         SET operating_entity = 'ERHA_FC' WHERE operating_entity IS NULL;
UPDATE public.goods_received_vouchers SET operating_entity = 'ERHA_FC' WHERE operating_entity IS NULL;
UPDATE public.supplier_invoices       SET operating_entity = 'ERHA_FC' WHERE operating_entity IS NULL;
UPDATE public.stock_items             SET operating_entity = 'ERHA_FC' WHERE operating_entity IS NULL;
UPDATE public.stock_transactions      SET operating_entity = 'ERHA_FC' WHERE operating_entity IS NULL;
UPDATE public.stock_counts            SET operating_entity = 'ERHA_FC' WHERE operating_entity IS NULL;
UPDATE public.activity_log            SET operating_entity = 'ERHA_FC' WHERE operating_entity IS NULL;

-- ---------------------------------------------------------------------
-- 3) Indexes on operating_entity
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_jobs_operating_entity                    ON public.jobs(operating_entity);
CREATE INDEX IF NOT EXISTS idx_rfqs_operating_entity                    ON public.rfqs(operating_entity);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_operating_entity       ON public.purchase_requests(operating_entity);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_operating_entity         ON public.purchase_orders(operating_entity);
CREATE INDEX IF NOT EXISTS idx_goods_received_vouchers_operating_entity ON public.goods_received_vouchers(operating_entity);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_operating_entity       ON public.supplier_invoices(operating_entity);
CREATE INDEX IF NOT EXISTS idx_stock_items_operating_entity             ON public.stock_items(operating_entity);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_operating_entity      ON public.stock_transactions(operating_entity);
CREATE INDEX IF NOT EXISTS idx_stock_counts_operating_entity            ON public.stock_counts(operating_entity);
CREATE INDEX IF NOT EXISTS idx_activity_log_operating_entity            ON public.activity_log(operating_entity);

-- ---------------------------------------------------------------------
-- 4) Sequences — rename existing → _fc, create _ss, add GRV pair
-- ---------------------------------------------------------------------
ALTER SEQUENCE IF EXISTS public.job_number_seq RENAME TO job_number_seq_fc;
ALTER SEQUENCE IF EXISTS public.pr_number_seq  RENAME TO pr_number_seq_fc;
ALTER SEQUENCE IF EXISTS public.po_number_seq  RENAME TO po_number_seq_fc;

-- Safety nets in case the rename didn't find an existing sequence
CREATE SEQUENCE IF NOT EXISTS public.job_number_seq_fc START 1;
CREATE SEQUENCE IF NOT EXISTS public.pr_number_seq_fc  START 1;
CREATE SEQUENCE IF NOT EXISTS public.po_number_seq_fc  START 1;

CREATE SEQUENCE IF NOT EXISTS public.job_number_seq_ss START 1;
CREATE SEQUENCE IF NOT EXISTS public.pr_number_seq_ss  START 1;
CREATE SEQUENCE IF NOT EXISTS public.po_number_seq_ss  START 1;

CREATE SEQUENCE IF NOT EXISTS public.grv_number_seq_fc START 1;
CREATE SEQUENCE IF NOT EXISTS public.grv_number_seq_ss START 1;

-- ---------------------------------------------------------------------
-- 5) Entity-aware number-generation trigger functions
-- ---------------------------------------------------------------------

-- 5a) Jobs — format: JOB-FC26-0001 / JOB-SS26-0001
-- The existing generate_job_number() returns TEXT; drop it (CASCADE
-- removes the old trigger) and redefine as a TRIGGER function.
DROP TRIGGER IF EXISTS trg_set_job_number ON public.jobs;
DROP FUNCTION IF EXISTS public.generate_job_number() CASCADE;

CREATE OR REPLACE FUNCTION public.generate_job_number()
RETURNS TRIGGER AS $$
DECLARE
  seq_val  BIGINT;
  year_str TEXT := to_char(now(), 'YY');
  prefix   TEXT;
BEGIN
  IF NEW.operating_entity = 'ERHA_SS' THEN
    prefix  := 'SS';
    seq_val := nextval('public.job_number_seq_ss');
  ELSE
    prefix  := 'FC';
    seq_val := nextval('public.job_number_seq_fc');
  END IF;

  IF NEW.job_number IS NULL OR NEW.job_number = '' THEN
    NEW.job_number := 'JOB-' || prefix || year_str || '-' || lpad(seq_val::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_job_number
  BEFORE INSERT ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.generate_job_number();

-- 5b) Purchase Requests — format: PR-FC26-0001 / PR-SS26-0001
CREATE OR REPLACE FUNCTION public.generate_pr_number()
RETURNS TRIGGER AS $$
DECLARE
  seq_val  BIGINT;
  year_str TEXT := to_char(now(), 'YY');
  prefix   TEXT;
BEGIN
  IF NEW.operating_entity = 'ERHA_SS' THEN
    prefix  := 'SS';
    seq_val := nextval('public.pr_number_seq_ss');
  ELSE
    prefix  := 'FC';
    seq_val := nextval('public.pr_number_seq_fc');
  END IF;

  IF NEW.pr_number IS NULL OR NEW.pr_number = '' THEN
    NEW.pr_number := 'PR-' || prefix || year_str || '-' || lpad(seq_val::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_purchase_requests_pr_number ON public.purchase_requests;
CREATE TRIGGER trg_purchase_requests_pr_number
  BEFORE INSERT ON public.purchase_requests
  FOR EACH ROW EXECUTE FUNCTION public.generate_pr_number();

-- 5c) Purchase Orders — format: PO-FC26-0001 / PO-SS26-0001
CREATE OR REPLACE FUNCTION public.generate_po_number()
RETURNS TRIGGER AS $$
DECLARE
  seq_val  BIGINT;
  year_str TEXT := to_char(now(), 'YY');
  prefix   TEXT;
BEGIN
  IF NEW.operating_entity = 'ERHA_SS' THEN
    prefix  := 'SS';
    seq_val := nextval('public.po_number_seq_ss');
  ELSE
    prefix  := 'FC';
    seq_val := nextval('public.po_number_seq_fc');
  END IF;

  IF NEW.po_number IS NULL OR NEW.po_number = '' THEN
    NEW.po_number := 'PO-' || prefix || year_str || '-' || lpad(seq_val::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_purchase_orders_po_number ON public.purchase_orders;
CREATE TRIGGER trg_purchase_orders_po_number
  BEFORE INSERT ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_po_number();

-- 5d) Goods Received Vouchers — format: GRV-FC26-0001 / GRV-SS26-0001
-- Adds a grv_number column if it doesn't exist, then the trigger.
ALTER TABLE public.goods_received_vouchers
  ADD COLUMN IF NOT EXISTS grv_number TEXT UNIQUE;

CREATE OR REPLACE FUNCTION public.generate_grv_number()
RETURNS TRIGGER AS $$
DECLARE
  seq_val  BIGINT;
  year_str TEXT := to_char(now(), 'YY');
  prefix   TEXT;
BEGIN
  IF NEW.operating_entity = 'ERHA_SS' THEN
    prefix  := 'SS';
    seq_val := nextval('public.grv_number_seq_ss');
  ELSE
    prefix  := 'FC';
    seq_val := nextval('public.grv_number_seq_fc');
  END IF;

  IF NEW.grv_number IS NULL OR NEW.grv_number = '' THEN
    NEW.grv_number := 'GRV-' || prefix || year_str || '-' || lpad(seq_val::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_goods_received_vouchers_grv_number ON public.goods_received_vouchers;
CREATE TRIGGER trg_goods_received_vouchers_grv_number
  BEFORE INSERT ON public.goods_received_vouchers
  FOR EACH ROW EXECUTE FUNCTION public.generate_grv_number();

-- ---------------------------------------------------------------------
-- 6) Reload PostgREST schema cache
-- ---------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

COMMIT;
