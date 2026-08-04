-- US-P3-012 forward: jobs.workshop_status='INVOICED' -> rfqs.status='COMPLETED'
-- aggregation trigger.
--
-- Fires AFTER UPDATE OF workshop_status on jobs. When a linked job
-- transitions to 'INVOICED', count how many sibling jobs share the same
-- rfq_id and check whether all are in a terminal-invoiced state
-- ('INVOICED' or 'COMPLETED'). If yes, flip the parent RFQ from
-- 'JOB_CREATED' to 'COMPLETED' (the .eq-style guard on the WHERE clause
-- prevents accidental overwrites of intermediate states).
--
-- jobs.workshop_status has NO 'CANCELLED' value (see workshop_new_columns.sql),
-- so "active" simply means "every linked job". If a CANCELLED value is added
-- in future, update the FILTER clauses below to exclude it.
--
-- activity_log column shape matches the live production schema as used by
-- api/sign-submit.js: action_type, entity_type, entity_id, operating_entity,
-- metadata, created_at.

CREATE OR REPLACE FUNCTION public.trigger_rfq_completed_on_job_invoiced()
RETURNS TRIGGER AS $$
DECLARE
  rfq_uuid           UUID;
  rfq_entity         TEXT;
  total_jobs         INTEGER;
  invoiced_jobs      INTEGER;
  rows_updated       INTEGER;
BEGIN
  -- Only act when the row transitions INTO 'INVOICED' (not on no-op updates).
  IF NEW.workshop_status = 'INVOICED'
     AND (OLD.workshop_status IS NULL OR OLD.workshop_status <> 'INVOICED') THEN

    rfq_uuid := NEW.rfq_id;
    IF rfq_uuid IS NULL THEN
      RETURN NEW;  -- direct-created jobs have no parent RFQ
    END IF;

    SELECT
      COUNT(*),
      COUNT(*) FILTER (WHERE workshop_status IN ('INVOICED','COMPLETED'))
    INTO total_jobs, invoiced_jobs
    FROM public.jobs
    WHERE rfq_id = rfq_uuid;

    IF total_jobs > 0 AND invoiced_jobs = total_jobs THEN
      -- Capture the rfq's operating_entity for the activity_log entry.
      SELECT operating_entity INTO rfq_entity
        FROM public.rfqs WHERE id = rfq_uuid;

      -- Only promote if currently in JOB_CREATED. Prevents races with any
      -- earlier promotion or with the manual JOB_CREATED setter.
      UPDATE public.rfqs
        SET status = 'COMPLETED'
        WHERE id = rfq_uuid
          AND status = 'JOB_CREATED';

      GET DIAGNOSTICS rows_updated = ROW_COUNT;

      IF rows_updated > 0 THEN
        INSERT INTO public.activity_log
          (action_type, entity_type, entity_id, operating_entity, metadata, created_at)
        VALUES (
          'rfq_completed',
          'rfq',
          rfq_uuid,
          rfq_entity,
          jsonb_build_object(
            'total_linked_jobs',  total_jobs,
            'invoiced_jobs',      invoiced_jobs,
            'trigger_job_id',     NEW.id,
            'trigger_job_number', NEW.job_number
          ),
          NOW()
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS rfq_completed_on_job_invoiced ON public.jobs;

CREATE TRIGGER rfq_completed_on_job_invoiced
  AFTER UPDATE OF workshop_status ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_rfq_completed_on_job_invoiced();