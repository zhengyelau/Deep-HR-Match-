import { supabase } from '../lib/supabase';
import { Employer } from '../types';

export const employersService = {
  async saveEmployer(employer: Employer): Promise<Employer | null> {
    const { data, error } = await supabase
      .from('employer_job_descriptions')
      .upsert({
        job_id: employer.job_id,
        job_title: employer.job_title,
        employer_name: employer.employer_name,
        logo_url: employer.logo_url,
        elimination_criteria: employer.elimination_criteria,
        required_matching_criteria: employer.required_matching_criteria,
      }, { onConflict: 'job_id' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error saving employer:', error);
      return null;
    }

    return data || null;
  },

  async saveEmployers(employers: Employer[]): Promise<boolean> {
    try {
      for (const employer of employers) {
        await this.saveEmployer(employer);
      }
      return true;
    } catch (error) {
      console.error('Error saving employers:', error);
      return false;
    }
  },

  async getEmployers(): Promise<Employer[]> {
    const { data, error } = await supabase
      .from('employer_job_descriptions')
      .select('*')
      .order('job_id', { ascending: true });

    if (error) {
      console.error('Error fetching employers:', error);
      return [];
    }

    return (data || []).map(row => ({
      job_id: row.job_id,
      job_title: row.job_title,
      employer_name: row.employer_name,
      logo_url: row.logo_url,
      elimination_criteria: row.elimination_criteria || {},
      required_matching_criteria: row.required_matching_criteria || {},
    }));
  },

  async getEmployerByJobId(jobId: number): Promise<Employer | null> {
    const { data, error } = await supabase
      .from('employer_job_descriptions')
      .select('*')
      .eq('job_id', jobId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching employer:', error);
      return null;
    }

    if (!data) return null;

    return {
      job_id: data.job_id,
      job_title: data.job_title,
      employer_name: data.employer_name,
      logo_url: data.logo_url,
      elimination_criteria: data.elimination_criteria || {},
      required_matching_criteria: data.required_matching_criteria || {},
    };
  },

  async deleteEmployers(): Promise<boolean> {
    const { error } = await supabase
      .from('employer_job_descriptions')
      .delete()
      .gte('job_id', 0);

    if (error) {
      console.error('Error deleting employers:', error);
      return false;
    }

    return true;
  },
};
