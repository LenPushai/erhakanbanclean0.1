-- ============================================================================
-- FIX RLS POLICIES: Phase 3 tables — allow anon + authenticated
-- Run in Supabase SQL Editor
-- ============================================================================

BEGIN;

-- activity_log
ALTER POLICY "activity_log_select" ON public.activity_log TO anon, authenticated;
ALTER POLICY "activity_log_insert" ON public.activity_log TO anon, authenticated;

-- suppliers
ALTER POLICY "suppliers_select" ON public.suppliers TO anon, authenticated;
ALTER POLICY "suppliers_insert" ON public.suppliers TO anon, authenticated;
ALTER POLICY "suppliers_update" ON public.suppliers TO anon, authenticated;

-- purchase_requests
ALTER POLICY "purchase_requests_select" ON public.purchase_requests TO anon, authenticated;
ALTER POLICY "purchase_requests_insert" ON public.purchase_requests TO anon, authenticated;
ALTER POLICY "purchase_requests_update" ON public.purchase_requests TO anon, authenticated;

-- purchase_request_line_items
ALTER POLICY "pr_line_items_select" ON public.purchase_request_line_items TO anon, authenticated;
ALTER POLICY "pr_line_items_insert" ON public.purchase_request_line_items TO anon, authenticated;
ALTER POLICY "pr_line_items_update" ON public.purchase_request_line_items TO anon, authenticated;
ALTER POLICY "pr_line_items_delete" ON public.purchase_request_line_items TO anon, authenticated;

-- purchase_orders
ALTER POLICY "purchase_orders_select" ON public.purchase_orders TO anon, authenticated;
ALTER POLICY "purchase_orders_insert" ON public.purchase_orders TO anon, authenticated;
ALTER POLICY "purchase_orders_update" ON public.purchase_orders TO anon, authenticated;

-- po_line_items
ALTER POLICY "po_line_items_select" ON public.po_line_items TO anon, authenticated;
ALTER POLICY "po_line_items_insert" ON public.po_line_items TO anon, authenticated;
ALTER POLICY "po_line_items_update" ON public.po_line_items TO anon, authenticated;
ALTER POLICY "po_line_items_delete" ON public.po_line_items TO anon, authenticated;

-- goods_received_vouchers
ALTER POLICY "grvs_select" ON public.goods_received_vouchers TO anon, authenticated;
ALTER POLICY "grvs_insert" ON public.goods_received_vouchers TO anon, authenticated;
ALTER POLICY "grvs_update" ON public.goods_received_vouchers TO anon, authenticated;

-- grv_line_items
ALTER POLICY "grv_line_items_select" ON public.grv_line_items TO anon, authenticated;
ALTER POLICY "grv_line_items_insert" ON public.grv_line_items TO anon, authenticated;
ALTER POLICY "grv_line_items_update" ON public.grv_line_items TO anon, authenticated;

-- supplier_invoices
ALTER POLICY "supplier_invoices_select" ON public.supplier_invoices TO anon, authenticated;
ALTER POLICY "supplier_invoices_insert" ON public.supplier_invoices TO anon, authenticated;
ALTER POLICY "supplier_invoices_update" ON public.supplier_invoices TO anon, authenticated;

-- stock_items
ALTER POLICY "stock_items_select" ON public.stock_items TO anon, authenticated;
ALTER POLICY "stock_items_insert" ON public.stock_items TO anon, authenticated;
ALTER POLICY "stock_items_update" ON public.stock_items TO anon, authenticated;

-- stock_transactions
ALTER POLICY "stock_txn_select" ON public.stock_transactions TO anon, authenticated;
ALTER POLICY "stock_txn_insert" ON public.stock_transactions TO anon, authenticated;

-- stock_counts
ALTER POLICY "stock_counts_select" ON public.stock_counts TO anon, authenticated;
ALTER POLICY "stock_counts_insert" ON public.stock_counts TO anon, authenticated;
ALTER POLICY "stock_counts_update" ON public.stock_counts TO anon, authenticated;

-- stock_count_items
ALTER POLICY "stock_count_items_select" ON public.stock_count_items TO anon, authenticated;
ALTER POLICY "stock_count_items_insert" ON public.stock_count_items TO anon, authenticated;
ALTER POLICY "stock_count_items_update" ON public.stock_count_items TO anon, authenticated;

COMMIT;
