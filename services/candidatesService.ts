import { supabase } from '../lib/supabase';
import { Candidate } from '../types';

export const candidatesService = {
  async saveCandidate(candidate: Candidate): Promise<Candidate | null> {
    const { data, error } = await supabase
      .from('candidates')
      .upsert({
        candidate_id: candidate.candidate_id,
        profile_picture_url: candidate.profile_picture_url,
        first_name: candidate.first_name,
        last_name: candidate.last_name,
        age: candidate.age,
        gender: candidate.gender,
        email: candidate.email,
        phone: candidate.phone,
        date_of_birth: candidate.date_of_birth,
        ethnicity: candidate.ethnicity,
        race: candidate.race,
        religion: candidate.religion,
        nationality: candidate.nationality,
        country_of_birth: candidate.country_of_birth,
        current_country: candidate.current_country,
        availability: candidate.availability,
        visa_status: candidate.visa_status,
        desired_type_of_job_arrangement: candidate.desired_type_of_job_arrangement,
        elimination_criteria: candidate.questionnaire,
        past_current_hierarchy_in_title: candidate.past_current_hierarchy,
        past_current_function_in_title: candidate.past_current_function,
        past_current_job_title: candidate.past_current_title,
        past_current_motivation: candidate.past_current_motivation,
        past_current_values: candidate.past_current_values,
        past_current_hobbies: candidate.past_current_hobbies,
        past_current_talents: candidate.past_current_talents,
        past_current_education_subject: candidate.past_current_education_subject,
        past_current_university_major: candidate.past_current_university_major,
        past_current_university_ranking: candidate.past_current_university_ranking,
        past_current_role: candidate.past_current_role,
        past_current_domain: candidate.past_current_domain,
        past_current_function: candidate.past_current_function,
        past_current_structural_skills: candidate.past_current_structural_skills,
        past_current_system: candidate.past_current_system,
        past_salary_monthly: candidate.minimum_expected_salary_monthly,
        past_employer_1: candidate.past_employer_1,
        preferred_hierarchy_in_title: candidate.preferred_hierarchy,
        preferred_function_in_title: candidate.preferred_function,
        preferred_job_title: candidate.preferred_title,
        preferred_motivation: candidate.preferred_motivation,
        preferred_values: candidate.preferred_values,
        preferred_talents: candidate.preferred_talents,
        preferred_role: candidate.preferred_role,
        preferred_domain: candidate.preferred_domain,
        preferred_function: candidate.preferred_function,
        preferred_structural_skills: candidate.preferred_structural_skills,
        preferred_system: candidate.preferred_system,
        minimum_expected_salary_monthly: candidate.minimum_expected_salary_monthly,
      }, { onConflict: 'candidate_id' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error saving candidate:', error);
      return null;
    }

    return data || null;
  },

  async saveCandidates(candidates: Candidate[]): Promise<boolean> {
    try {
      for (const candidate of candidates) {
        await this.saveCandidate(candidate);
      }
      return true;
    } catch (error) {
      console.error('Error saving candidates:', error);
      return false;
    }
  },

  async getCandidates(): Promise<Candidate[]> {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .order('candidate_id', { ascending: true });

    if (error) {
      console.error('Error fetching candidates:', error);
      return [];
    }

    return (data || []).map(row => ({
      ...row,
      questionnaire: row.elimination_criteria,
      past_current_hierarchy: row.past_current_hierarchy_in_title,
      past_current_title: row.past_current_job_title,
      preferred_hierarchy: row.preferred_hierarchy_in_title,
      preferred_title: row.preferred_job_title,
      past_employer_1: row.past_employer_1,
    }));
  },

  async getCandidateById(candidateId: number): Promise<Candidate | null> {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('candidate_id', candidateId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching candidate:', error);
      return null;
    }

    if (!data) return null;

    return {
      ...data,
      questionnaire: data.elimination_criteria,
      past_current_hierarchy: data.past_current_hierarchy_in_title,
      past_current_title: data.past_current_job_title,
      preferred_hierarchy: data.preferred_hierarchy_in_title,
      preferred_title: data.preferred_job_title,
      past_employer_1: data.past_employer_1,
    };
  },

  async deleteCandidates(): Promise<boolean> {
    const { error } = await supabase
      .from('candidates')
      .delete()
      .gte('candidate_id', 0);

    if (error) {
      console.error('Error deleting candidates:', error);
      return false;
    }

    return true;
  },
};
