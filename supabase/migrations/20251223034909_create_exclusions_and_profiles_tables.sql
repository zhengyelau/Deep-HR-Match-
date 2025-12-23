/*
  # Create Candidate Exclusions and Employer Profiles Tables

  This migration adds functionality for candidates to exclude specific employers and stores employer demographic profiles.

  ## 1. New Tables

  ### `candidate_exclusions`
  Records which employers a candidate wants to exclude from consideration.
  - `id` (uuid, primary key)
  - `candidate_id` (integer, unique, references candidates)
  - `first_name` (text)
  - `last_name` (text)
  - `excluded_employer_name` (text[]) - Array of employer names to exclude
  - `excluded_employer_race` (text[]) - Array of employer races to exclude
  - `excluded_employer_religion` (text[]) - Array of employer religions to exclude
  - `excluded_employer_gender` (text[]) - Array of employer genders to exclude
  - `excluded_employer_country` (text[]) - Array of employer countries to exclude
  - `excluded_employer_city` (text[]) - Array of employer cities to exclude
  - `excluded_employer_incorporation_date` (text[]) - Array of incorporation dates to exclude
  - `excluded_employer_size` (integer) - Minimum employer size to exclude (e.g., exclude employers >= this size)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `employer_profiles`
  Stores demographic and company profile information about employers.
  - `id` (uuid, primary key)
  - `employer_name` (text, unique)
  - `employer_race` (text[]) - Array of races represented in employer
  - `employer_religion` (text[]) - Array of religions represented in employer
  - `employer_gender` (text[]) - Array of genders represented in employer
  - `employer_country` (text[]) - Array of countries where employer operates
  - `employer_city` (text[]) - Array of cities where employer operates
  - `incorporation_date` (text) - Year of incorporation
  - `employer_size` (integer) - Number of employees
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## 2. Security

  - Enable RLS on both tables
  - Add policies for public access (development mode)

  ## Important Notes

  - Candidate exclusions are checked BEFORE standard elimination criteria
  - If a candidate has excluded an employer by name, race, religion, gender, country, city, incorporation date, or size, they will be filtered out
  - Exclusion logic is case-insensitive for string comparisons
  - Array fields allow for multiple exclusions in each category
*/

-- Create candidate_exclusions table
CREATE TABLE IF NOT EXISTS candidate_exclusions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id integer UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  excluded_employer_name text[] DEFAULT '{}',
  excluded_employer_race text[] DEFAULT '{}',
  excluded_employer_religion text[] DEFAULT '{}',
  excluded_employer_gender text[] DEFAULT '{}',
  excluded_employer_country text[] DEFAULT '{}',
  excluded_employer_city text[] DEFAULT '{}',
  excluded_employer_incorporation_date text[] DEFAULT '{}',
  excluded_employer_size integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create employer_profiles table
CREATE TABLE IF NOT EXISTS employer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_name text UNIQUE NOT NULL,
  employer_race text[] DEFAULT '{}',
  employer_religion text[] DEFAULT '{}',
  employer_gender text[] DEFAULT '{}',
  employer_country text[] DEFAULT '{}',
  employer_city text[] DEFAULT '{}',
  incorporation_date text NOT NULL,
  employer_size integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_candidate_exclusions_candidate_id ON candidate_exclusions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_employer_profiles_employer_name ON employer_profiles(employer_name);

-- Enable RLS
ALTER TABLE candidate_exclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for candidate_exclusions
CREATE POLICY "Anyone can read candidate exclusions"
  ON candidate_exclusions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert candidate exclusions"
  ON candidate_exclusions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update candidate exclusions"
  ON candidate_exclusions FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete candidate exclusions"
  ON candidate_exclusions FOR DELETE
  TO public
  USING (true);

-- RLS Policies for employer_profiles
CREATE POLICY "Anyone can read employer profiles"
  ON employer_profiles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert employer profiles"
  ON employer_profiles FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update employer profiles"
  ON employer_profiles FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete employer profiles"
  ON employer_profiles FOR DELETE
  TO public
  USING (true);
