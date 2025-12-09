/*
  # Create Candidate Evaluations Table

  1. New Tables
    - `candidate_evaluations`
      - `id` (uuid, primary key)
      - `job_id` (bigint, foreign key to employer_job_descriptions)
      - `candidate_id` (bigint, foreign key to candidates)
      - `rating` (text - 'Top Fit', 'Maybe', 'Not a Fit', or null for Unrated)
      - `is_shortlisted` (boolean - whether candidate is added to shortlist)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `candidate_evaluations` table
    - Add policy for public access (matching the pattern of other tables)

  3. Purpose
    - Stores employer's evaluation of candidates for each job
    - Tracks ratings assigned by the employer
    - Tracks which candidates are shortlisted
*/

CREATE TABLE IF NOT EXISTS candidate_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id bigint NOT NULL REFERENCES employer_job_descriptions(job_id) ON DELETE CASCADE,
  candidate_id bigint NOT NULL REFERENCES candidates(candidate_id) ON DELETE CASCADE,
  rating text,
  is_shortlisted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(job_id, candidate_id)
);

ALTER TABLE candidate_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on candidate_evaluations"
  ON candidate_evaluations FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert on candidate_evaluations"
  ON candidate_evaluations FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update on candidate_evaluations"
  ON candidate_evaluations FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on candidate_evaluations"
  ON candidate_evaluations FOR DELETE
  TO public
  USING (true);
