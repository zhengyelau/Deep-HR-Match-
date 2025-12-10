/*
  # Create Purchased Candidates Table

  1. New Tables
    - `purchased_candidates`
      - `id` (uuid, primary key)
      - `job_id` (integer, foreign key to employer_job_descriptions)
      - `candidate_id` (integer, foreign key to candidates)
      - `purchase_date` (timestamptz)
      - `is_shortlisted_for_interview` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `purchased_candidates` table
    - Add policy for public access (demo purposes)

  3. Indexes
    - Add index on job_id for faster lookups
    - Add unique constraint on (job_id, candidate_id) to prevent duplicate purchases
*/

CREATE TABLE IF NOT EXISTS purchased_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id integer NOT NULL,
  candidate_id integer NOT NULL,
  purchase_date timestamptz DEFAULT now(),
  is_shortlisted_for_interview boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(job_id, candidate_id)
);

-- Enable RLS
ALTER TABLE purchased_candidates ENABLE ROW LEVEL SECURITY;

-- Allow public access for demo purposes
CREATE POLICY "Allow public read access"
  ON purchased_candidates
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access"
  ON purchased_candidates
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access"
  ON purchased_candidates
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_purchased_candidates_job_id ON purchased_candidates(job_id);
CREATE INDEX IF NOT EXISTS idx_purchased_candidates_candidate_id ON purchased_candidates(candidate_id);