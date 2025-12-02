/*
  # Create Match Results and Match Details Tables

  ## Summary
  Creates two related tables to store matching results between candidates and job positions:
  - `match_results`: Stores the main match score and metadata for each candidate-job pair
  - `match_details`: Stores the detailed breakdown of matches for each result by category

  ## New Tables

  1. **match_results**
     - `id` (uuid, primary key): Unique identifier for each match result
     - `job_id` (bigint): Reference to the job from employer_job_descriptions
     - `candidate_id` (bigint): Reference to the candidate
     - `rank` (integer): Ranking position among all candidates for this job
     - `score` (numeric): Match score value
     - `percentage` (numeric): Match percentage (0-100)
     - `is_eliminated` (boolean): Whether candidate was eliminated
     - `elimination_reasons` (text[]): Array of reasons for elimination if applicable
     - `created_at` (timestamp): When the match was calculated
     - `updated_at` (timestamp): When the match was last updated
     - Unique constraint on (job_id, candidate_id) to prevent duplicate match records

  2. **match_details**
     - `id` (uuid, primary key): Unique identifier for each detail record
     - `match_result_id` (uuid): Foreign key to match_results.id
     - `category` (text): Category being matched (e.g., 'education', 'experience', 'skills')
     - `score` (numeric): Score for this specific category
     - `past_current_matches` (text[]): Array of matching items from candidate's past/current experience
     - `preferred_matches` (text[]): Array of matching items from candidate's preferred criteria
     - `created_at` (timestamp): When the detail was created

  ## Security
  - Row Level Security (RLS) enabled on both tables
  - Public read access for match_results (for dashboard viewing)
  - RLS policies restrict modifications to authenticated users only
  - Foreign key relationship with ON DELETE CASCADE ensures detail cleanup

  ## Indexes
  - Composite index on (job_id, candidate_id) for efficient querying
  - Index on category for filtering match details
*/

CREATE TABLE IF NOT EXISTS match_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id bigint NOT NULL,
  candidate_id bigint NOT NULL,
  rank integer NOT NULL,
  score numeric NOT NULL,
  percentage numeric NOT NULL,
  is_eliminated boolean DEFAULT false,
  elimination_reasons text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(job_id, candidate_id),
  FOREIGN KEY (job_id) REFERENCES employer_job_descriptions(job_id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES candidates(candidate_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS match_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_result_id uuid NOT NULL,
  category text NOT NULL,
  score numeric NOT NULL,
  past_current_matches text[] DEFAULT '{}',
  preferred_matches text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  FOREIGN KEY (match_result_id) REFERENCES match_results(id) ON DELETE CASCADE
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_match_results_job_id ON match_results(job_id);
CREATE INDEX IF NOT EXISTS idx_match_results_candidate_id ON match_results(candidate_id);
CREATE INDEX IF NOT EXISTS idx_match_results_job_candidate ON match_results(job_id, candidate_id);
CREATE INDEX IF NOT EXISTS idx_match_details_match_result_id ON match_details(match_result_id);
CREATE INDEX IF NOT EXISTS idx_match_details_category ON match_details(category);

-- Enable RLS
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_details ENABLE ROW LEVEL SECURITY;

-- RLS Policies for match_results
CREATE POLICY "Allow public read on match_results"
  ON match_results FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert on match_results"
  ON match_results FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on match_results"
  ON match_results FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on match_results"
  ON match_results FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for match_details
CREATE POLICY "Allow public read on match_details"
  ON match_details FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert on match_details"
  ON match_details FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on match_details"
  ON match_details FOR DELETE
  TO authenticated
  USING (true);
