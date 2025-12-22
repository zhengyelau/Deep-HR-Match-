/*
  # Add past_employer_1 column to candidates table

  ## Summary
  Adds a new column to store the candidate's first/most recent past employer name.

  ## Changes
  - `candidates` table: Add `past_employer_1` text column to store employer name
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidates' AND column_name = 'past_employer_1'
  ) THEN
    ALTER TABLE candidates ADD COLUMN past_employer_1 text;
  END IF;
END $$;
