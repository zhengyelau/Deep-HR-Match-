import { supabase } from '../lib/supabase';
import { MatchResult, MatchDetails } from '../types';

export const matchResultsService = {
  async saveMatchResult(jobId: number, matchResult: MatchResult): Promise<string | null> {
    const { data, error } = await supabase
      .from('match_results')
      .upsert({
        job_id: jobId,
        candidate_id: matchResult.candidate.candidate_id,
        rank: matchResult.rank,
        score: matchResult.score,
        percentage: matchResult.percentage,
        is_eliminated: matchResult.isEliminated,
        elimination_reasons: matchResult.eliminationReasons,
      }, { onConflict: 'job_id,candidate_id' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error saving match result:', error);
      return null;
    }

    if (!data) return null;

    await this.saveMatchDetails(data.id, matchResult.details);

    return data.id;
  },

  async saveMatchResults(jobId: number, matchResults: MatchResult[]): Promise<boolean> {
    try {
      for (const result of matchResults) {
        await this.saveMatchResult(jobId, result);
      }
      return true;
    } catch (error) {
      console.error('Error saving match results:', error);
      return false;
    }
  },

  async saveMatchDetails(matchResultId: string, details: MatchDetails): Promise<boolean> {
    try {
      for (const breakdown of details.breakdown) {
        const { error } = await supabase
          .from('match_details')
          .insert({
            match_result_id: matchResultId,
            category: breakdown.category,
            score: breakdown.score,
            past_current_matches: breakdown.pastCurrentMatches,
            preferred_matches: breakdown.preferredMatches,
          });

        if (error) {
          console.error('Error saving match detail:', error);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error saving match details:', error);
      return false;
    }
  },

  async getMatchResultsByJobId(jobId: number): Promise<MatchResult[]> {
    const { data, error } = await supabase
      .from('match_results')
      .select('*')
      .eq('job_id', jobId)
      .order('rank', { ascending: true });

    if (error) {
      console.error('Error fetching match results:', error);
      return [];
    }

    return data || [];
  },

  async getMatchDetailsByResultId(matchResultId: string): Promise<MatchDetails['breakdown']> {
    const { data, error } = await supabase
      .from('match_details')
      .select('*')
      .eq('match_result_id', matchResultId);

    if (error) {
      console.error('Error fetching match details:', error);
      return [];
    }

    return (data || []).map(row => ({
      category: row.category,
      score: row.score,
      pastCurrentMatches: row.past_current_matches || [],
      preferredMatches: row.preferred_matches || [],
    }));
  },

  async deleteMatchResultsByJobId(jobId: number): Promise<boolean> {
    const { error } = await supabase
      .from('match_results')
      .delete()
      .eq('job_id', jobId);

    if (error) {
      console.error('Error deleting match results:', error);
      return false;
    }

    return true;
  },

  async deleteAllMatchResults(): Promise<boolean> {
    const { error } = await supabase
      .from('match_results')
      .delete()
      .gte('job_id', 0);

    if (error) {
      console.error('Error deleting all match results:', error);
      return false;
    }

    return true;
  },
};
