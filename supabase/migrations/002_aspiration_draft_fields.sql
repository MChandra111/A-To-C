-- Allow aspirations to be saved during onboarding before timeline (Phase 4) is complete
ALTER TABLE aspirations
  ALTER COLUMN end_date DROP NOT NULL,
  ALTER COLUMN interval DROP NOT NULL;

ALTER TABLE aspirations
  ADD COLUMN IF NOT EXISTS scraped_requirements TEXT;

-- Draft aspirations: end_date and interval are null until timeline step completes
COMMENT ON COLUMN aspirations.scraped_requirements IS
  'Claude-extracted requirements from target_url, editable by the user';
