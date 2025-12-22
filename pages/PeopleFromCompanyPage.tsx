import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Search, ShoppingCart } from 'lucide-react';
import { Button, Card } from '../components/UI';
import { SimplifiedCandidateCard } from '../components/SimplifiedCandidateCard';
import { MatchResult, Candidate } from '../types';
import { candidatesService } from '../services/candidatesService';
import { candidateEvaluationService } from '../services/candidateEvaluationService';

interface PeopleFromCompanyPageProps {
  companyName: string;
  jobId: number;
  onBack: () => void;
  onProceedToPurchase: () => void;
}

export const PeopleFromCompanyPage: React.FC<PeopleFromCompanyPageProps> = ({
  companyName,
  jobId,
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
        const allCandidates = await candidatesService.getCandidates();

        // Filter candidates by company name
        const filteredCandidates = allCandidates.filter(candidate =>
          candidate.past_employer_1?.toLowerCase() === companyName.toLowerCase()
        );

        // Create MatchResult objects without actual scoring (since we're just browsing by company)
        const results: MatchResult[] = filteredCandidates.map((candidate, index) => ({
          candidate,
          rank: index + 1,
          score: 0,
          percentage: 0,
          isEliminated: false,
          eliminationReasons: [],
          details: { totalScore: 0, percentage: 0, breakdown: [] }
        }));

        setMatchResults(results);

        // Load existing ratings for these candidates
        const evaluations = await candidateEvaluationService.getEvaluationsByJobId(jobId);
        const ratings: Record<number, string> = {};
        results.forEach(r => {
          const candidateId = r.candidate.candidate_id;
          if (evaluations[candidateId]?.rating) {
            ratings[candidateId] = evaluations[candidateId].rating;
          }
        });
        setCandidateRatings(ratings);
      } catch (error) {
        console.error('Error loading candidates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCandidates();
  }, [companyName, jobId]);

  const updateCandidateRating = async (candidateId: number, rating: string) => {
    setCandidateRatings(prev => ({...prev, [candidateId]: rating}));
    // Save to database
    await candidateEvaluationService.saveEvaluation(jobId, candidateId, rating, false);
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
              All Candidates from {companyName}
            </h1>
            <p className="text-slate-600">
              Showing all candidates who previously worked at {companyName}
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
            <span className="font-bold">Discover more candidates</span> from {companyName} who may be a good fit for your positions.
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
