-- CR-5: Dynamic Actions Required
-- Run this in Supabase SQL Editor

-- Add actions_required_dynamic JSONB column to jobs and rfqs
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS actions_required_dynamic JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.rfqs
  ADD COLUMN IF NOT EXISTS actions_required_dynamic JSONB DEFAULT '[]'::jsonb;

-- Seed action_types into system_dropdowns
INSERT INTO public.system_dropdowns
  (dropdown_type, option_value, option_label, sort_order)
VALUES
  ('action_types', 'manufacture', 'Manufacture', 1),
  ('action_types', 'sandblast', 'Sandblast', 2),
  ('action_types', 'service', 'Service', 3),
  ('action_types', 'paint', 'Paint', 4),
  ('action_types', 'repair', 'Repair', 5),
  ('action_types', 'installation', 'Installation', 6),
  ('action_types', 'cut', 'Cut', 7),
  ('action_types', 'modify', 'Modify', 8)
ON CONFLICT (dropdown_type, option_value) DO NOTHING;

NOTIFY pgrst, 'reload schema';
