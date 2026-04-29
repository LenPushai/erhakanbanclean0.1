BEGIN;

ALTER TABLE public.job_line_items
  ADD COLUMN IF NOT EXISTS parent_line_item_id UUID
  REFERENCES public.job_line_items(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_jli_parent_line_item_id
  ON public.job_line_items(parent_line_item_id)
  WHERE parent_line_item_id IS NOT NULL;

-- Backfill: link existing child mirrors to their parent line items
DO $$
DECLARE
  linked_count INTEGER;
  unmatched_count INTEGER;
BEGIN
  UPDATE public.job_line_items child
  SET parent_line_item_id = parent.id
  FROM public.job_line_items parent
  WHERE parent.child_job_id = child.job_id
    AND child.sort_order = 0
    AND child.can_spawn_job = false
    AND child.parent_line_item_id IS NULL;

  GET DIAGNOSTICS linked_count = ROW_COUNT;

  SELECT COUNT(*) INTO unmatched_count
  FROM public.job_line_items child
  JOIN public.job_line_items parent ON parent.child_job_id = child.job_id
  WHERE child.parent_line_item_id IS NULL
    AND child.can_spawn_job = false;

  RAISE NOTICE 'US-002 backfill: linked % child mirror(s); % candidate(s) remain unlinked (manual review if non-zero)',
    linked_count, unmatched_count;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
