-- Fix A4 & A5: Rename Cut/Modify, Add Machining/Supply
-- Run this in Supabase SQL Editor

-- Rename Cut to Cutting
UPDATE public.system_dropdowns
SET option_label = 'Cutting'
WHERE dropdown_type = 'action_types' AND option_value = 'cut';

-- Rename Modify to Modification
UPDATE public.system_dropdowns
SET option_label = 'Modification'
WHERE dropdown_type = 'action_types' AND option_value = 'modify';

-- Add Machining
INSERT INTO public.system_dropdowns
  (dropdown_type, option_value, option_label, sort_order)
VALUES
  ('action_types', 'machining', 'Machining', 9)
ON CONFLICT (dropdown_type, option_value) DO NOTHING;

-- Add Supply
INSERT INTO public.system_dropdowns
  (dropdown_type, option_value, option_label, sort_order)
VALUES
  ('action_types', 'supply', 'Supply', 10)
ON CONFLICT (dropdown_type, option_value) DO NOTHING;

NOTIFY pgrst, 'reload schema';
