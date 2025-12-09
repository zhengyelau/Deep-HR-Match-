import { supabase } from '../lib/supabase';

export const candidateEvaluationService = {
  async saveEvaluation(jobId: number, candidateId: number, rating: string | null, isShortlisted: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('candidate_evaluations')
      .upsert({
        job_id: jobId,
        candidate_id: candidateId,
        rating: rating || null,
        is_shortlisted: isShortlisted,
      }, { onConflict: 'job_id,candidate_id' });

    if (error) {
      console.error('Error saving evaluation:', error);
      return false;
    }

    return true;
  },

  async getEvaluationsByJobId(jobId: number): Promise<Record<number, { rating: string | null; isShortlisted: boolean }>> {
    const { data, error } = await supabase
      .from('candidate_evaluations')
      .select('candidate_id, rating, is_shortlisted')
      .eq('job_id', jobId);

    if (error) {
      console.error('Error fetching evaluations:', error);
      return {};
    }

    const evaluations: Record<number, { rating: string | null; isShortlisted: boolean }> = {};
    (data || []).forEach(row => {
      evaluations[row.candidate_id] = {
        rating: row.rating,
        isShortlisted: row.is_shortlisted,
      };
    });

    return evaluations;
  },

  async deleteEvaluationsByJobId(jobId: number): Promise<boolean> {
    const { error } = await supabase
      .from('candidate_evaluations')
      .delete()
      .eq('job_id', jobId);

    if (error) {
      console.error('Error deleting evaluations:', error);
      return false;
    }

    return true;
  },
};
