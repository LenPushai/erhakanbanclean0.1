-- System Dropdowns Table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.system_dropdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dropdown_type TEXT NOT NULL,
  option_value TEXT NOT NULL,
  option_label TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(dropdown_type, option_value)
);

CREATE INDEX IF NOT EXISTS idx_system_dropdowns_type
  ON public.system_dropdowns (dropdown_type, is_active);

ALTER TABLE public.system_dropdowns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dropdowns_select" ON public.system_dropdowns
  FOR SELECT USING (true);
CREATE POLICY "dropdowns_insert" ON public.system_dropdowns
  FOR INSERT WITH CHECK (true);
CREATE POLICY "dropdowns_update" ON public.system_dropdowns
  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "dropdowns_delete" ON public.system_dropdowns
  FOR DELETE USING (true);

-- Seed existing Media Received options
INSERT INTO public.system_dropdowns
  (dropdown_type, option_value, option_label, sort_order)
VALUES
  ('media_received', 'walk_in', 'Walk-in', 1),
  ('media_received', 'email', 'Email', 2),
  ('media_received', 'whatsapp', 'WhatsApp', 3),
  ('media_received', 'phone', 'Phone', 4),
  ('media_received', 'post', 'Post', 5),
  ('departments', 'fabrication', 'Fabrication', 1),
  ('departments', 'construction', 'Construction', 2),
  ('departments', 'maintenance', 'Maintenance', 3),
  ('departments', 'engineering', 'Engineering', 4),
  ('departments', 'stores', 'Stores', 5)
ON CONFLICT (dropdown_type, option_value) DO NOTHING;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
