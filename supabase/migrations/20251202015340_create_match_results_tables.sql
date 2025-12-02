/*
  # Create Match Results and Details Tables

  1. New Tables
    - `match_results`: Stores matching scores between candidates and jobs
      - `id` (uuid, primary key)
      - `job_id` (integer, foreign key reference)
      - `candidate_id` (integer, candidate reference)
      - `rank` (integer, ranking within this job)
      - `score` (integer, total match score)
      - `percentage` (integer, match percentage 0-100)
      - `is_eliminated` (boolean, whether candidate failed elimination criteria)
      - `elimination_reasons` (text[], array of reasons why eliminated)
      - `created_at`, `updated_at` (timestamps)

    - `match_details`: Stores breakdown of matches by category
      - `id` (uuid, primary key)
      - `match_result_id` (uuid, foreign key to match_results)
      - `category` (text, category name like 'motivation', 'skills')
      - `score` (integer, points for this category)
      - `past_current_matches` (text[], items matched from past/current)
      - `preferred_matches` (text[], items matched from preferred)
      - `created_at`, `updated_at` (timestamps)

  2. Security
    - Enable RLS on both tables
    - Public read access for data retrieval
    - Authenticated write for data insertion/updates

  3. Indexes
    - job_id, candidate_id for fast lookups
    - match_result_id in match_details
*/

CREATE TABLE IF NOT EXISTS match_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id integer NOT NULL,
  candidate_id integer NOT NULL,
  rank integer NOT NULL DEFAULT 0,
  score integer NOT NULL DEFAULT 0,
  percentage integer NOT NULL DEFAULT 0,
  is_eliminated boolean NOT NULL DEFAULT false,
  elimination_reasons text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(job_id, candidate_id)
);

CREATE TABLE IF NOT EXISTS match_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_result_id uuid NOT NULL REFERENCES match_results(id) ON DELETE CASCADE,
  category text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  past_current_matches text[] DEFAULT '{}',
  preferred_matches text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Match results are readable by everyone"
  ON match_results FOR SELECT
  USING (true);

CREATE POLICY "Only authenticated users can insert match results"
  ON match_results FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can update match results"
  ON match_results FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can delete match results"
  ON match_results FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Match details are readable by everyone"
  ON match_details FOR SELECT
  USING (true);

CREATE POLICY "Only authenticated users can insert match details"
  ON match_details FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can update match details"
  ON match_details FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can delete match details"
  ON match_details FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX idx_match_results_job_id ON match_results(job_id);
CREATE INDEX idx_match_results_candidate_id ON match_results(candidate_id);
CREATE INDEX idx_match_results_job_candidate ON match_results(job_id, candidate_id);
CREATE INDEX idx_match_details_match_result_id ON match_details(match_result_id);
