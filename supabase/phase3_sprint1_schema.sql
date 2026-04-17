-- ============================================================================
-- ERHA OPERATIONS SYSTEM — PHASE 3 SPRINT 1 SCHEMA
-- Modules: Procurement + Internal Store + Activity Log
-- Generated: 2026-04-14
-- Run in: Supabase SQL Editor (single transaction)
-- ============================================================================
-- SAFETY: Does NOT modify any existing Phase 1 / Phase 2 tables.
--         Does NOT drop any existing tables.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 0. UTILITY: updated_at trigger function (idempotent)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 0a. INDEX on jobs.job_number (skip if already exists)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_jobs_job_number ON public.jobs (job_number);

-- ============================================================================
-- 1. ACTIVITY LOG (ML event logging)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.activity_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type    TEXT NOT NULL,
  entity_type   TEXT NOT NULL,
  entity_id     UUID NOT NULL,
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_by    UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_entity
  ON public.activity_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_event_type
  ON public.activity_log (event_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_by
  ON public.activity_log (created_by);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at
  ON public.activity_log (created_at DESC);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_log_select" ON public.activity_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "activity_log_insert" ON public.activity_log
  FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================================
-- 2. PROCUREMENT MODULE
-- ============================================================================

-- 2a. suppliers
-- ============================================================================
CREATE TABLE public.suppliers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name    TEXT NOT NULL,
  contact_person  TEXT,
  phone           TEXT,
  email           TEXT,
  account_number  TEXT,
  payment_terms   TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_suppliers_company_name ON public.suppliers (company_name);
CREATE INDEX idx_suppliers_is_active    ON public.suppliers (is_active);

CREATE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suppliers_select" ON public.suppliers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "suppliers_insert" ON public.suppliers
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "suppliers_update" ON public.suppliers
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 2b. purchase_requests
-- ============================================================================
CREATE TABLE public.purchase_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id           UUID REFERENCES public.suppliers(id),
  job_id                UUID REFERENCES public.jobs(id),
  required_by_date      DATE,
  status                TEXT NOT NULL DEFAULT 'PENDING_APPROVAL'
    CHECK (status IN (
      'PENDING_APPROVAL','APPROVED','REJECTED','PO_ISSUED'
    )),
  total_estimated_value DECIMAL(12,2) DEFAULT 0,
  raised_by             UUID,
  approved_by           UUID,
  approved_at           TIMESTAMPTZ,
  rejection_reason      TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_purchase_requests_supplier_id ON public.purchase_requests (supplier_id);
CREATE INDEX idx_purchase_requests_job_id      ON public.purchase_requests (job_id);
CREATE INDEX idx_purchase_requests_status      ON public.purchase_requests (status);
CREATE INDEX idx_purchase_requests_raised_by   ON public.purchase_requests (raised_by);

CREATE TRIGGER trg_purchase_requests_updated_at
  BEFORE UPDATE ON public.purchase_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchase_requests_select" ON public.purchase_requests
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "purchase_requests_insert" ON public.purchase_requests
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "purchase_requests_update" ON public.purchase_requests
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 2c. purchase_request_line_items
-- ============================================================================
CREATE TABLE public.purchase_request_line_items (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_request_id  UUID NOT NULL REFERENCES public.purchase_requests(id) ON DELETE CASCADE,
  description          TEXT NOT NULL,
  quantity             DECIMAL(12,3) NOT NULL DEFAULT 1,
  uom                  TEXT,
  estimated_unit_price DECIMAL(12,2) DEFAULT 0,
  estimated_total      DECIMAL(12,2) DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pr_line_items_pr_id ON public.purchase_request_line_items (purchase_request_id);

CREATE TRIGGER trg_pr_line_items_updated_at
  BEFORE UPDATE ON public.purchase_request_line_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.purchase_request_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pr_line_items_select" ON public.purchase_request_line_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "pr_line_items_insert" ON public.purchase_request_line_items
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pr_line_items_update" ON public.purchase_request_line_items
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "pr_line_items_delete" ON public.purchase_request_line_items
  FOR DELETE TO authenticated USING (true);

-- 2d. purchase_orders
-- ============================================================================
CREATE TABLE public.purchase_orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_request_id UUID REFERENCES public.purchase_requests(id),
  supplier_id         UUID NOT NULL REFERENCES public.suppliers(id),
  job_id              UUID REFERENCES public.jobs(id),
  po_number           TEXT NOT NULL UNIQUE,
  status              TEXT NOT NULL DEFAULT 'ISSUED'
    CHECK (status IN (
      'ISSUED','PARTIALLY_RECEIVED','FULLY_RECEIVED','INVOICED','CLOSED'
    )),
  total_value         DECIMAL(12,2) DEFAULT 0,
  issued_by           UUID,
  issued_at           TIMESTAMPTZ DEFAULT now(),
  required_by_date    DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_purchase_orders_pr_id        ON public.purchase_orders (purchase_request_id);
CREATE INDEX idx_purchase_orders_supplier_id  ON public.purchase_orders (supplier_id);
CREATE INDEX idx_purchase_orders_job_id       ON public.purchase_orders (job_id);
CREATE INDEX idx_purchase_orders_status       ON public.purchase_orders (status);
CREATE INDEX idx_purchase_orders_po_number    ON public.purchase_orders (po_number);

CREATE TRIGGER trg_purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchase_orders_select" ON public.purchase_orders
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "purchase_orders_insert" ON public.purchase_orders
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "purchase_orders_update" ON public.purchase_orders
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 2e. po_line_items
-- ============================================================================
CREATE TABLE public.po_line_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id             UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  description       TEXT NOT NULL,
  quantity_ordered  DECIMAL(12,3) NOT NULL DEFAULT 0,
  quantity_received DECIMAL(12,3) NOT NULL DEFAULT 0,
  uom               TEXT,
  unit_price        DECIMAL(12,2) DEFAULT 0,
  total_price       DECIMAL(12,2) DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_po_line_items_po_id ON public.po_line_items (po_id);

CREATE TRIGGER trg_po_line_items_updated_at
  BEFORE UPDATE ON public.po_line_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.po_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "po_line_items_select" ON public.po_line_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "po_line_items_insert" ON public.po_line_items
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "po_line_items_update" ON public.po_line_items
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "po_line_items_delete" ON public.po_line_items
  FOR DELETE TO authenticated USING (true);

-- 2f. goods_received_vouchers
-- ============================================================================
CREATE TABLE public.goods_received_vouchers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id       UUID NOT NULL REFERENCES public.purchase_orders(id),
  received_by UUID,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_grvs_po_id ON public.goods_received_vouchers (po_id);
CREATE INDEX idx_grvs_received_by ON public.goods_received_vouchers (received_by);

CREATE TRIGGER trg_grvs_updated_at
  BEFORE UPDATE ON public.goods_received_vouchers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.goods_received_vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grvs_select" ON public.goods_received_vouchers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "grvs_insert" ON public.goods_received_vouchers
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "grvs_update" ON public.goods_received_vouchers
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 2g. grv_line_items
-- ============================================================================
CREATE TABLE public.grv_line_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grv_id            UUID NOT NULL REFERENCES public.goods_received_vouchers(id) ON DELETE CASCADE,
  po_line_item_id   UUID NOT NULL REFERENCES public.po_line_items(id),
  quantity_received DECIMAL(12,3) NOT NULL DEFAULT 0,
  condition         TEXT NOT NULL DEFAULT 'GOOD'
    CHECK (condition IN ('GOOD','DAMAGED','SHORT')),
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_grv_line_items_grv_id         ON public.grv_line_items (grv_id);
CREATE INDEX idx_grv_line_items_po_line_item_id ON public.grv_line_items (po_line_item_id);

CREATE TRIGGER trg_grv_line_items_updated_at
  BEFORE UPDATE ON public.grv_line_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.grv_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grv_line_items_select" ON public.grv_line_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "grv_line_items_insert" ON public.grv_line_items
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "grv_line_items_update" ON public.grv_line_items
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 2h. supplier_invoices
-- ============================================================================
CREATE TABLE public.supplier_invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id           UUID NOT NULL REFERENCES public.purchase_orders(id),
  supplier_id     UUID NOT NULL REFERENCES public.suppliers(id),
  invoice_number  TEXT NOT NULL,
  invoice_date    DATE NOT NULL,
  invoice_value   DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_due_date DATE,
  pdf_url         TEXT,
  status          TEXT NOT NULL DEFAULT 'PENDING_MATCH'
    CHECK (status IN (
      'PENDING_MATCH','MATCHED','MISMATCH','PAYMENT_AUTHORISED','PAID'
    )),
  match_result    JSONB DEFAULT '{}'::jsonb,
  captured_by     UUID,
  authorised_by   UUID,
  authorised_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_supplier_invoices_po_id       ON public.supplier_invoices (po_id);
CREATE INDEX idx_supplier_invoices_supplier_id ON public.supplier_invoices (supplier_id);
CREATE INDEX idx_supplier_invoices_status      ON public.supplier_invoices (status);
CREATE INDEX idx_supplier_invoices_inv_number  ON public.supplier_invoices (invoice_number);

CREATE TRIGGER trg_supplier_invoices_updated_at
  BEFORE UPDATE ON public.supplier_invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.supplier_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "supplier_invoices_select" ON public.supplier_invoices
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "supplier_invoices_insert" ON public.supplier_invoices
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "supplier_invoices_update" ON public.supplier_invoices
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- 3. INTERNAL STORE MODULE
-- ============================================================================

-- 3a. stock_items
-- ============================================================================
CREATE TABLE public.stock_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code        TEXT NOT NULL UNIQUE,
  item_name        TEXT NOT NULL,
  category         TEXT,
  uom              TEXT,
  current_quantity DECIMAL(12,3) NOT NULL DEFAULT 0,
  reorder_level    DECIMAL(12,3) DEFAULT 0,
  reorder_quantity DECIMAL(12,3) DEFAULT 0,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  last_unit_price  DECIMAL(12,2) DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_items_item_code ON public.stock_items (item_code);
CREATE INDEX idx_stock_items_category  ON public.stock_items (category);
CREATE INDEX idx_stock_items_is_active ON public.stock_items (is_active);

CREATE TRIGGER trg_stock_items_updated_at
  BEFORE UPDATE ON public.stock_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stock_items_select" ON public.stock_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "stock_items_insert" ON public.stock_items
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "stock_items_update" ON public.stock_items
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 3b. stock_transactions
-- ============================================================================
CREATE TABLE public.stock_transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_item_id    UUID NOT NULL REFERENCES public.stock_items(id),
  transaction_type TEXT NOT NULL
    CHECK (transaction_type IN (
      'RECEIPT_PO','RECEIPT_MANUAL','ISSUE_JOB','RETURN_JOB','ADJUSTMENT','MIGRATION'
    )),
  reference_id     UUID,
  reference_type   TEXT,
  quantity_change   DECIMAL(12,3) NOT NULL DEFAULT 0,
  quantity_before   DECIMAL(12,3) NOT NULL DEFAULT 0,
  quantity_after    DECIMAL(12,3) NOT NULL DEFAULT 0,
  unit_price        DECIMAL(12,2) DEFAULT 0,
  job_id            UUID REFERENCES public.jobs(id),
  grv_id            UUID REFERENCES public.goods_received_vouchers(id),
  transacted_by     UUID,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_txn_stock_item_id ON public.stock_transactions (stock_item_id);
CREATE INDEX idx_stock_txn_type          ON public.stock_transactions (transaction_type);
CREATE INDEX idx_stock_txn_job_id        ON public.stock_transactions (job_id);
CREATE INDEX idx_stock_txn_grv_id        ON public.stock_transactions (grv_id);
CREATE INDEX idx_stock_txn_created_at    ON public.stock_transactions (created_at DESC);

ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stock_txn_select" ON public.stock_transactions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "stock_txn_insert" ON public.stock_transactions
  FOR INSERT TO authenticated WITH CHECK (true);

-- 3c. stock_counts
-- ============================================================================
CREATE TABLE public.stock_counts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  initiated_by  UUID,
  status        TEXT NOT NULL DEFAULT 'IN_PROGRESS'
    CHECK (status IN ('IN_PROGRESS','RECONCILED')),
  reconciled_by UUID,
  reconciled_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_counts_status ON public.stock_counts (status);

CREATE TRIGGER trg_stock_counts_updated_at
  BEFORE UPDATE ON public.stock_counts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.stock_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stock_counts_select" ON public.stock_counts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "stock_counts_insert" ON public.stock_counts
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "stock_counts_update" ON public.stock_counts
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 3d. stock_count_items
-- ============================================================================
CREATE TABLE public.stock_count_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_count_id    UUID NOT NULL REFERENCES public.stock_counts(id) ON DELETE CASCADE,
  stock_item_id     UUID NOT NULL REFERENCES public.stock_items(id),
  system_quantity   DECIMAL(12,3) NOT NULL DEFAULT 0,
  physical_quantity DECIMAL(12,3) NOT NULL DEFAULT 0,
  variance          DECIMAL(12,3) NOT NULL DEFAULT 0,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_count_items_count_id ON public.stock_count_items (stock_count_id);
CREATE INDEX idx_stock_count_items_item_id  ON public.stock_count_items (stock_item_id);

CREATE TRIGGER trg_stock_count_items_updated_at
  BEFORE UPDATE ON public.stock_count_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.stock_count_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stock_count_items_select" ON public.stock_count_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "stock_count_items_insert" ON public.stock_count_items
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "stock_count_items_update" ON public.stock_count_items
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- 4. PO NUMBER SEQUENCE (auto-generate PO-YYYY-NNN)
-- ============================================================================
CREATE SEQUENCE IF NOT EXISTS public.po_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_po_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.po_number IS NULL OR NEW.po_number = '' THEN
    NEW.po_number := 'PO-' || to_char(now(), 'YYYY') || '-' ||
                     lpad(nextval('public.po_number_seq')::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_purchase_orders_po_number
  BEFORE INSERT ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_po_number();

COMMIT;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Tables created (14 new + 1 index on existing):
--
-- ACTIVITY LOG:
--   activity_log          - ML event logging for all modules
--
-- PROCUREMENT (8 tables):
--   suppliers             - Approved supplier register
--   purchase_requests     - PRs raised by Sonja, approved by Hendrik
--   purchase_request_line_items - Line items on a PR
--   purchase_orders       - Auto-generated on PR approval (PO-YYYY-NNN)
--   po_line_items         - Line items on a PO
--   goods_received_vouchers - GRVs logged by Charles
--   grv_line_items        - What was actually received per GRV
--   supplier_invoices     - 3-way match invoices captured by Sonja
--
-- INTERNAL STORE (4 tables):
--   stock_items           - Stock register with reorder levels
--   stock_transactions    - Every stock movement (in/out/adjust)
--   stock_counts          - Periodic physical count headers
--   stock_count_items     - Per-item count results with variance
--
-- Also created:
--   idx_jobs_job_number   - Index on existing jobs.job_number
--   po_number_seq         - Sequence for auto PO numbering
--   set_updated_at()      - Shared trigger function
--   generate_po_number()  - Auto PO number trigger
-- ============================================================================
