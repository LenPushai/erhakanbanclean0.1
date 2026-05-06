-- =====================================================================
-- US-J4: Seed compiled_by options into system_dropdowns
-- File:  supabase/usj4_compiled_by_dropdown_seed.sql
-- Date:  2026-05-05
--
-- Adds three rows (Cherise, Jeanic, Hendrik) to public.system_dropdowns
-- so the React Compiled By dropdown becomes admin-editable via the
-- existing system_dropdowns admin UI rather than hardcoded.
--
-- Idempotent: WHERE NOT EXISTS guard keyed on (dropdown_type, option_label).
-- Re-running is a clean no-op.
--
-- Mid-UAT safety:
--   - Pure INSERT, no schema change
--   - Other dropdown_types unaffected
--   - React fallback in patch_j4_compiled_by_dropdown.cjs returns the same
--     three names so the UI works identically before and after this seed
--     runs (this script just moves the source of truth from code to DB)
-- =====================================================================

INSERT INTO public.system_dropdowns
       (dropdown_type, option_value, option_label, sort_order, is_active)
SELECT 'compiled_by', v.option_value, v.option_label, v.sort_order, true
  FROM (VALUES
    ('cherise', 'Cherise', 1),
    ('jeanic',  'Jeanic',  2),
    ('hendrik', 'Hendrik', 3)
  ) AS v(option_value, option_label, sort_order)
 WHERE NOT EXISTS (
   SELECT 1
     FROM public.system_dropdowns
    WHERE dropdown_type = 'compiled_by'
      AND option_label  = v.option_label
 );

-- Verification
SELECT dropdown_type, option_value, option_label, sort_order, is_active
  FROM public.system_dropdowns
 WHERE dropdown_type = 'compiled_by'
 ORDER BY sort_order;