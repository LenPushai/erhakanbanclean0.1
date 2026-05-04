-- US-004 hotfix: add missing is_no_card column to jobs table
-- Applied to production via SQL editor 2026-05-04 during UAT
-- Reference git tag: hotfix-us004-jobs-no-card-2026-05-04

ALTER TABLE jobs
    ADD COLUMN IF NOT EXISTS is_no_card BOOLEAN DEFAULT FALSE NOT NULL;

COMMENT ON COLUMN jobs.is_no_card IS 'Persistent flag (US-004) indicating job should not print a job card. Mirrors rfqs.is_no_card.';