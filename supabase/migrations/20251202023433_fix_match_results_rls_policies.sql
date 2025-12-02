/*
  # Fix RLS Policies for Match Results Tables

  1. Changes
    - Drop existing restrictive authenticated-only policies
    - Add new policies allowing public (anonymous) access for all operations
    - This allows the frontend to read and write match results using the anon key

  2. Security Note
    - These tables contain computed match results, not sensitive user data
    - Public access is appropriate for this use case
    - For production, consider adding more restrictive policies based on your auth requirements
*/

-- Match Results Table
DROP POLICY IF EXISTS "Allow public read on match_results" ON match_results;
DROP POLICY IF EXISTS "Allow authenticated insert on match_results" ON match_results;
DROP POLICY IF EXISTS "Allow authenticated update on match_results" ON match_results;
DROP POLICY IF EXISTS "Allow authenticated delete on match_results" ON match_results;

CREATE POLICY "Allow public read on match_results"
  ON match_results FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert on match_results"
  ON match_results FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update on match_results"
  ON match_results FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on match_results"
  ON match_results FOR DELETE
  TO public
  USING (true);

-- Match Details Table
DROP POLICY IF EXISTS "Allow public read on match_details" ON match_details;
DROP POLICY IF EXISTS "Allow authenticated insert on match_details" ON match_details;
DROP POLICY IF EXISTS "Allow authenticated delete on match_details" ON match_details;

CREATE POLICY "Allow public read on match_details"
  ON match_details FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert on match_details"
  ON match_details FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update on match_details"
  ON match_details FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on match_details"
  ON match_details FOR DELETE
  TO public
  USING (true);
