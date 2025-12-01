export interface Questionnaire {
  q1_overtime_or_weekends: string;
  q2_driving_license: string;
  q3_own_car: string;
  q4_willing_to_travel: string;
  q5_legal_right_to_work: string;
  q6_bachelor_degree_or_required_education: string;
  q7_required_years_experience: string;
  q8_willing_full_time: string;
  q9_willing_to_relocate: string;
  q10_comfortable_with_background_checks: string;
}

export interface Candidate {
  id?: string;
  candidate_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  age: number;
  race: string;
  ethnicity: string;
  dialect: string;
  religion?: string;
  country_of_birth: string;
  nationality: string;
  current_country: string;
  current_city: string;
  visa_status: string;
  month_and_year_moved_to_current_country: string;
  months_in_current_country?: number;
  availability: string;
  minimum_expected_salary_monthly: number;
  desired_type_of_job_arrangement: string;
  desired_job_hierarchy_in_title: string;
  desired_employer: string;
  desired_role?: string;
  desired_domain: string;
  desired_function?: string;
  desired_structural_skills?: string;
  desired_system?: string;
  profile_picture_url?: string;
  height_cm?: number;
  weight_kg?: number;
  fitness_level?: string;

  // Past & Current (Comma separated)
  past_current_title?: string;
  past_current_motivation?: string;
  past_current_values?: string;
  past_current_hobbies?: string;
  past_current_talents?: string;
  past_current_education_subject?: string;
  past_current_university_major?: string;
  past_current_university_ranking?: string;
  past_current_role?: string;
  past_current_domain?: string;
  past_current_function?: string;
  past_current_structural_skills?: string;
  past_current_system?: string;
  past_current_hierarchy?: string;
  past_current_work_arrangement?: string;

  // Preferred (Comma separated)
  preferred_title?: string;
  preferred_motivation?: string;
  preferred_values?: string;
  preferred_hobbies?: string;
  preferred_talents?: string;
  preferred_role?: string;
  preferred_domain?: string;
  preferred_function?: string;
  preferred_structural_skills?: string;
  preferred_system?: string;
  preferred_hierarchy?: string;
  preferred_work_arrangement?: string;

  // Questionnaire
  questionnaire?: Questionnaire;

  created_at?: string;
  updated_at?: string;
}

export interface Employer {
  job_id: number;
  job_title: string;
  employer_name: string;
  logo_url?: string;

  elimination_criteria: {
    age?: string; // "25-35"
    ethnicity?: string;
    race?: string;
    religion?: string;
    nationality?: string;
    country_of_birth?: string;
    current_country?: string;
    salary_monthly?: number;
    availability?: string;
    visa_status?: string;
    job_arrangement?: string;
  };

  required_matching_criteria: {
    [key: string]: { field1?: string; field2?: string; field3?: string; } | undefined;
  };
}

export interface MatchDetails {
    totalScore: number;
    percentage: number;
    breakdown: {
        category: string;
        score: number;
        pastCurrentMatches: string[];
        preferredMatches: string[];
    }[];
}

export interface MatchResult {
  candidate: Candidate;
  rank: number;
  score: number;
  percentage: number;
  isEliminated: boolean;
  eliminationReasons: string[];
  details: MatchDetails;
}

export type ChartType = 
  | 'salary' 
  | 'age' 
  | 'availability' 
  | 'education' 
  | 'major' 
  | 'function' 
  | 'domain';