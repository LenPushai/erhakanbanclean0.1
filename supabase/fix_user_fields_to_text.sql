-- Fix user reference fields from UUID to TEXT
-- Since this app uses role-based access (HENDRIK, SONJA, JUANIC) not Supabase auth,
-- these fields need to accept text role names.
-- Run in Supabase SQL Editor.

BEGIN;

-- purchase_requests
ALTER TABLE public.purchase_requests ALTER COLUMN raised_by TYPE TEXT;
ALTER TABLE public.purchase_requests ALTER COLUMN approved_by TYPE TEXT;

-- purchase_orders
ALTER TABLE public.purchase_orders ALTER COLUMN issued_by TYPE TEXT;

-- goods_received_vouchers
ALTER TABLE public.goods_received_vouchers ALTER COLUMN received_by TYPE TEXT;

-- supplier_invoices
ALTER TABLE public.supplier_invoices ALTER COLUMN captured_by TYPE TEXT;
ALTER TABLE public.supplier_invoices ALTER COLUMN authorised_by TYPE TEXT;

-- stock_transactions
ALTER TABLE public.stock_transactions ALTER COLUMN transacted_by TYPE TEXT;

-- stock_counts
ALTER TABLE public.stock_counts ALTER COLUMN initiated_by TYPE TEXT;
ALTER TABLE public.stock_counts ALTER COLUMN reconciled_by TYPE TEXT;

-- activity_log
ALTER TABLE public.activity_log ALTER COLUMN user_id TYPE TEXT;

COMMIT;
