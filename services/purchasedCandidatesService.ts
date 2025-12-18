import { supabase } from '../lib/supabase';

export interface PurchasedCandidate {
  id: string;
  job_id: number;
  candidate_id: number;
  purchase_date: string;
  is_shortlisted_for_interview: boolean;
  created_at: string;
  updated_at: string;
}

export const purchasedCandidatesService = {
  async purchaseCandidate(jobId: number, candidateId: number): Promise<boolean> {
    const { error } = await supabase
      .from('purchased_candidates')
      .insert({
        job_id: jobId,
        candidate_id: candidateId,
      });

    if (error) {
      console.error('Error purchasing candidate:', error);
      return false;
    }

    return true;
  },

  async purchaseCandidates(jobId: number, candidateIds: number[]): Promise<boolean> {
    try {
      for (const candidateId of candidateIds) {
        await this.purchaseCandidate(jobId, candidateId);
      }
      return true;
    } catch (error) {
      console.error('Error purchasing candidates:', error);
      return false;
    }
  },

  async getPurchasedCandidatesByJobId(jobId: number): Promise<PurchasedCandidate[]> {
    const { data, error } = await supabase
      .from('purchased_candidates')
      .select('*')
      .eq('job_id', jobId)
      .order('purchase_date', { ascending: false });

    if (error) {
      console.error('Error fetching purchased candidates:', error);
      return [];
    }

    return data || [];
  },

  async toggleInterviewShortlist(id: string, isShortlisted: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('purchased_candidates')
      .update({
        is_shortlisted_for_interview: isShortlisted,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error toggling interview shortlist:', error);
      return false;
    }

    return true;
  },

  async isPurchased(jobId: number, candidateId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('purchased_candidates')
      .select('id')
      .eq('job_id', jobId)
      .eq('candidate_id', candidateId)
      .maybeSingle();

    if (error) {
      console.error('Error checking if candidate is purchased:', error);
      return false;
    }

    return !!data;
  },

  async getAllShortlistedCandidates(): Promise<PurchasedCandidate[]> {
    const { data, error } = await supabase
      .from('purchased_candidates')
      .select('*')
      .eq('is_shortlisted_for_interview', true)
      .order('purchase_date', { ascending: false });

    if (error) {
      console.error('Error fetching all shortlisted candidates:', error);
      return [];
    }

    return data || [];
  },
};
