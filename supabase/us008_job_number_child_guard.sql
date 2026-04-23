-- =====================================================================
-- US-008: Restore child-job guard on unified job-number trigger
-- Date:   2026-04-23
--
-- Regression introduced by CR-1 (supabase/cr1_dual_entity.sql,
-- 2026-04-17) which dropped the set_job_number() trigger from CR-04
-- (supabase/job_number_sequence.sql, 2026-04-15) and replaced it with
-- a unified generate_job_number() trigger function -- but omitted the
-- is_child_job guard.
--
-- Symptom: every INSERT on public.jobs consumes from either
-- job_number_seq_fc or job_number_seq_ss, even when the caller passes
-- an explicit child job_number like 'JOB-FC26-0042-A'. The consumed
-- value is silently discarded -> gaps in primary sequences.
--
-- This migration redefines ONLY the generate_job_number() function.
-- Trigger, sequences, and entity-aware branching are preserved exactly.
-- Output format is unchanged: JOB-FC26-0001 / JOB-SS26-0001.
--
-- Existing sequence positions are NOT reset. Past gaps remain; new
-- gaps stop accumulating.
-- =====================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.generate_job_number()
RETURNS TRIGGER AS $$
DECLARE
  seq_val  BIGINT;
  year_str TEXT := to_char(now(), 'YY');
  prefix   TEXT;
BEGIN
  -- Child jobs carry a caller-supplied letter-suffix number
  -- (e.g. 'JOB-FC26-0042-A'). They must never consume from the
  -- primary sequence. Early-return preserves the explicit job_number.
  IF NEW.is_child_job IS TRUE THEN
    RETURN NEW;
  END IF;

  -- Defensive: any row that already carries an explicit job_number
  -- (imports, manual entry, historical rewrites) also skips the
  -- sequence. Mirrors the original CR-04 guard.
  IF NEW.job_number IS NOT NULL AND NEW.job_number <> '' THEN
    RETURN NEW;
  END IF;

  IF NEW.operating_entity = 'ERHA_SS' THEN
    prefix  := 'SS';
    seq_val := nextval('public.job_number_seq_ss');
  ELSE
    prefix  := 'FC';
    seq_val := nextval('public.job_number_seq_fc');
  END IF;

  NEW.job_number := 'JOB-' || prefix || year_str || '-' || lpad(seq_val::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

NOTIFY pgrst, 'reload schema';

COMMIT;
