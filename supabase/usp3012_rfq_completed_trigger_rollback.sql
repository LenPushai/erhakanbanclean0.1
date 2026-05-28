-- US-P3-012 rollback: remove the rfqs.COMPLETED aggregation trigger.

DROP TRIGGER IF EXISTS rfq_completed_on_job_invoiced ON public.jobs;
DROP FUNCTION IF EXISTS public.trigger_rfq_completed_on_job_invoiced();