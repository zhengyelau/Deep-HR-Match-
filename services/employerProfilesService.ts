import { supabase } from '../lib/supabase';
import { EmployerProfile } from '../types';

export const employerProfilesService = {
  async saveEmployerProfile(profile: EmployerProfile): Promise<EmployerProfile | null> {
    const { data, error } = await supabase
      .from('employer_profiles')
      .upsert({
        employer_name: profile.employer_name,
        employer_race: profile.employer_race,
        employer_religion: profile.employer_religion,
        employer_gender: profile.employer_gender,
        employer_country: profile.employer_country,
        employer_city: profile.employer_city,
        incorporation_date: profile.incorporation_date,
        employer_size: profile.employer_size,
      }, { onConflict: 'employer_name' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error saving employer profile:', error);
      return null;
    }

    return data || null;
  },

  async saveEmployerProfiles(profiles: EmployerProfile[]): Promise<boolean> {
    try {
      for (const profile of profiles) {
        await this.saveEmployerProfile(profile);
      }
      return true;
    } catch (error) {
      console.error('Error saving employer profiles:', error);
      return false;
    }
  },

  async getEmployerProfiles(): Promise<EmployerProfile[]> {
    const { data, error } = await supabase
      .from('employer_profiles')
      .select('*')
      .order('employer_name', { ascending: true });

    if (error) {
      console.error('Error fetching employer profiles:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      employer_name: row.employer_name,
      employer_race: row.employer_race || [],
      employer_religion: row.employer_religion || [],
      employer_gender: row.employer_gender || [],
      employer_country: row.employer_country || [],
      employer_city: row.employer_city || [],
      incorporation_date: row.incorporation_date,
      employer_size: row.employer_size || 0,
    }));
  },

  async getEmployerProfileByName(employerName: string): Promise<EmployerProfile | null> {
    const { data, error } = await supabase
      .from('employer_profiles')
      .select('*')
      .eq('employer_name', employerName)
      .maybeSingle();

    if (error) {
      console.error('Error fetching employer profile:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      employer_name: data.employer_name,
      employer_race: data.employer_race || [],
      employer_religion: data.employer_religion || [],
      employer_gender: data.employer_gender || [],
      employer_country: data.employer_country || [],
      employer_city: data.employer_city || [],
      incorporation_date: data.incorporation_date,
      employer_size: data.employer_size || 0,
    };
  },

  async deleteEmployerProfiles(): Promise<boolean> {
    const { error } = await supabase
      .from('employer_profiles')
      .delete()
      .gte('employer_size', 0);

    if (error) {
      console.error('Error deleting employer profiles:', error);
      return false;
    }

    return true;
  },
};
