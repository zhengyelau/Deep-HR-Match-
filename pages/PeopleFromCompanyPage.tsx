import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Search, ShoppingCart } from 'lucide-react';
import { Button, Card } from '../components/UI';
import { SimplifiedCandidateCard } from '../components/SimplifiedCandidateCard';
import { MatchResult, Employer } from '../types';
import { candidatesService } from '../services/candidatesService';
import { matchResultsService } from '../services/matchResultsService';
import { candidateEvaluationService } from '../services/candidateEvaluationService';

interface PeopleFromCompanyPageProps {
  employer: Employer;
  onBack: () => void;
  onProceedToPurchase: () => void;
}

export const PeopleFromCompanyPage: React.FC<PeopleFromCompanyPageProps> = ({
  employer,
  onBack,
  onProceedToPurchase
}) => {
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [candidateRatings, setCandidateRatings] = useState<Record<number, string>>({});

  useEffect(() => {
    const loadCandidates = async () => {
      setIsLoading(true);
      try {
        const candidates = await candidatesService.getCandidates();
        const savedResults = await matchResultsService.getMatchResultsByJobId(employer.job_id);

        if (savedResults.length > 0) {
          const enrichedResults = await Promise.all(savedResults.map(async (saved) => {
            const candidate = candidates.find(c => c.candidate_id === saved.candidate_id);
            if (!candidate) return null;
            const breakdown = await matchResultsService.getMatchDetailsByResultId(saved.id);

            return {
              candidate,
              rank: saved.rank,
              score: saved.score,
              percentage: saved.percentage,
              isEliminated: saved.is_eliminated,
              eliminationReasons: saved.elimination_reasons || [],
              details: { totalScore: saved.score, percentage: saved.percentage, breakdown: breakdown }
            };
          }));

          const validResults = enrichedResults.filter((r): r is MatchResult => r !== null);
          setMatchResults(validResults);

          const evaluations = await candidateEvaluationService.getEvaluationsByJobId(employer.job_id);
          const ratings: Record<number, string> = {};
          validResults.forEach(r => {
            const candidateId = r.candidate.candidate_id;
            if (evaluations[candidateId]?.rating) {
              ratings[candidateId] = evaluations[candidateId].rating;
            }
          });
          setCandidateRatings(ratings);
        }
      } catch (error) {
        console.error('Error loading candidates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCandidates();
  }, [employer.job_id]);

  const updateCandidateRating = async (candidateId: number, rating: string) => {
    setCandidateRatings(prev => ({...prev, [candidateId]: rating}));
    await candidateEvaluationService.saveEvaluation(employer.job_id, candidateId, rating, false);
  };

  const allRated = matchResults.length > 0 && matchResults.every(r => candidateRatings[r.candidate.candidate_id]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Loading candidates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              All Candidates from the Employer: {employer.employer_name}
            </h1>
            <p className="text-slate-600">
              {employer.job_title}
            </p>
          </div>
          <Button variant="secondary" onClick={onBack} className="bg-slate-700 text-white border-transparent hover:bg-slate-800">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Shortlisted
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <div className="bg-blue-600 text-white rounded-full p-1.5 mt-0.5 shrink-0">
          <span className="font-bold text-base px-1.5">!</span>
        </div>
        <div>
          <p className="text-blue-900/80 text-sm">
            <span className="font-bold">Discover more candidates</span> who may be a good fit for this position at {employer.employer_name}.
            Review their profiles and rate them to expand your talent pool.
          </p>
        </div>
      </div>

      {/* Stats Card */}
      <div className="mb-10">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 shadow-sm max-w-xs">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">NUMBER OF CANDIDATES</h4>
          <p className="text-4xl font-bold text-emerald-800">{matchResults.length}</p>
        </div>
      </div>

      {/* Candidates List */}
      <div className="pb-24">
        {matchResults.length === 0 ? (
          <Card className="overflow-hidden border border-slate-200 shadow-sm">
            <div className="p-6 md:p-8">
              <div className="flex flex-col items-center justify-center py-12">
                <div className="bg-slate-100 p-6 rounded-full mb-4">
                  <Search size={48} className="text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  No candidates found
                </h3>
                <p className="text-slate-500 mb-8 max-w-md text-center">
                  There are no candidates available for this company at the moment.
                </p>
                <Button variant="secondary" onClick={onBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Shortlisted
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden border border-slate-200 shadow-sm">
            <div className="p-6 md:p-8">
              <div className="space-y-12">
                {matchResults.map((res, index) => (
                  <div key={res.candidate.candidate_id} className={index > 0 ? "pt-12 border-t border-slate-200" : ""}>
                    <SimplifiedCandidateCard
                      result={res}
                      rating={candidateRatings[res.candidate.candidate_id] || ''}
                      onRate={updateCandidateRating}
                    />
                  </div>
                ))}
              </div>

              {allRated && (
                <div className="mt-8 pt-8 border-t border-slate-100 flex justify-end animate-in fade-in slide-in-from-bottom-2 sticky bottom-4 z-10 pointer-events-none">
                  <Button
                    size="lg"
                    onClick={onProceedToPurchase}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg rounded-full flex items-center gap-2 font-bold shadow-xl transition-all hover:scale-105 pointer-events-auto"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Proceed to Purchase
                  </Button>
                </div>
              )}

              {!allRated && matchResults.length > 0 && (
                <div className="mt-8 pt-8 border-t border-slate-100 bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                  <p className="text-yellow-800 font-semibold text-lg mb-2">Please rate all candidates before proceeding</p>
                  <p className="text-yellow-700 text-sm">You need to assign a rating to each candidate to continue to purchase.</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
