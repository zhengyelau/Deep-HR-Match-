import { supabase } from '../lib/supabase';
import { CandidateExclusion } from '../types';

export const candidateExclusionsService = {
  async saveCandidateExclusion(exclusion: CandidateExclusion): Promise<CandidateExclusion | null> {
    const { data, error } = await supabase
      .from('candidate_exclusions')
      .upsert({
        candidate_id: exclusion.candidate_id,
        first_name: exclusion.first_name,
        last_name: exclusion.last_name,
        excluded_employer_name: exclusion.excluded_employer_name,
        excluded_employer_race: exclusion.excluded_employer_race,
        excluded_employer_religion: exclusion.excluded_employer_religion,
        excluded_employer_gender: exclusion.excluded_employer_gender,
        excluded_employer_country: exclusion.excluded_emplyer_country,
        excluded_employer_city: exclusion.excluded_employer_city,
        excluded_employer_incorporation_date: exclusion.excluded_employer_incorporation_date,
        excluded_employer_size: exclusion.excluded_employer_size,
      }, { onConflict: 'candidate_id' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error saving candidate exclusion:', error);
      return null;
    }

    return data || null;
  },

  async saveCandidateExclusions(exclusions: CandidateExclusion[]): Promise<boolean> {
    try {
      for (const exclusion of exclusions) {
        await this.saveCandidateExclusion(exclusion);
      }
      return true;
    } catch (error) {
      console.error('Error saving candidate exclusions:', error);
      return false;
    }
  },

  async getCandidateExclusions(): Promise<CandidateExclusion[]> {
    const { data, error } = await supabase
      .from('candidate_exclusions')
      .select('*')
      .order('candidate_id', { ascending: true });

    if (error) {
      console.error('Error fetching candidate exclusions:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      candidate_id: row.candidate_id,
      first_name: row.first_name,
      last_name: row.last_name,
      excluded_employer_name: row.excluded_employer_name || [],
      excluded_employer_race: row.excluded_employer_race || [],
      excluded_employer_religion: row.excluded_employer_religion || [],
      excluded_employer_gender: row.excluded_employer_gender || [],
      excluded_emplyer_country: row.excluded_employer_country || [],
      excluded_employer_city: row.excluded_employer_city || [],
      excluded_employer_incorporation_date: row.excluded_employer_incorporation_date || [],
      excluded_employer_size: row.excluded_employer_size || 0,
    }));
  },

  async getCandidateExclusionById(candidateId: number): Promise<CandidateExclusion | null> {
    const { data, error } = await supabase
      .from('candidate_exclusions')
      .select('*')
      .eq('candidate_id', candidateId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching candidate exclusion:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      candidate_id: data.candidate_id,
      first_name: data.first_name,
      last_name: data.last_name,
      excluded_employer_name: data.excluded_employer_name || [],
      excluded_employer_race: data.excluded_employer_race || [],
      excluded_employer_religion: data.excluded_employer_religion || [],
      excluded_employer_gender: data.excluded_employer_gender || [],
      excluded_emplyer_country: data.excluded_employer_country || [],
      excluded_employer_city: data.excluded_employer_city || [],
      excluded_employer_incorporation_date: data.excluded_employer_incorporation_date || [],
      excluded_employer_size: data.excluded_employer_size || 0,
    };
  },

  async deleteCandidateExclusions(): Promise<boolean> {
    const { error } = await supabase
      .from('candidate_exclusions')
      .delete()
      .gte('candidate_id', 0);

    if (error) {
      console.error('Error deleting candidate exclusions:', error);
      return false;
    }

    return true;
  },
};
