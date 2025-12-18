import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingCart, Check, Info, X, CheckSquare, Square } from 'lucide-react';
import { Button, Card, Badge } from '../components/UI';
import { Avatar } from '../components/Avatar';
import { MatchResult, Employer } from '../types';
import { candidatesService } from '../services/candidatesService';
import { matchResultsService } from '../services/matchResultsService';
import { candidateEvaluationService } from '../services/candidateEvaluationService';
import { CheckoutModal } from '../components/CheckoutModal';
import { purchasedCandidatesService } from '../services/purchasedCandidatesService';

interface PeopleFromCompanyPurchasePageProps {
  employer: Employer;
  onBack: () => void;
  onPurchaseComplete: () => void;
}

export const PeopleFromCompanyPurchasePage: React.FC<PeopleFromCompanyPurchasePageProps> = ({
  employer,
  onBack,
  onPurchaseComplete
}) => {
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [candidateRatings, setCandidateRatings] = useState<Record<number, string>>({});
  const [paymentIds, setPaymentIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'Top Fit' | 'Maybe' | 'Not a Fit'>('Top Fit');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
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
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [employer.job_id]);

  const togglePayment = (id: number) => {
    const next = new Set(paymentIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPaymentIds(next);
  };

  const handleCompletePurchase = async () => {
    const candidateIdsToPurchase = Array.from(paymentIds);
    const success = await purchasedCandidatesService.purchaseCandidates(employer.job_id, candidateIdsToPurchase);

    if (success) {
      setIsCheckoutOpen(false);
      onPurchaseComplete();
    }
  };

  const topFitCount = matchResults.filter(r => candidateRatings[r.candidate.candidate_id] === 'Top Fit').length;
  const maybeCount = matchResults.filter(r => candidateRatings[r.candidate.candidate_id] === 'Maybe').length;
  const notFitCount = matchResults.filter(r => candidateRatings[r.candidate.candidate_id] === 'Not a Fit').length;

  const itemsToShow = matchResults.filter(r => candidateRatings[r.candidate.candidate_id] === activeFilter);

  const renderCandidateCard = (res: MatchResult) => {
    const { candidate } = res;
    const isPaymentSelected = paymentIds.has(candidate.candidate_id);
    const rating = candidateRatings[candidate.candidate_id];

    return (
      <div key={candidate.candidate_id} className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-all">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
          <div className="flex items-center gap-4">
            <Avatar
              candidateId={candidate.candidate_id}
              firstName={candidate.first_name}
              lastName={candidate.last_name}
              profilePictureUrl={candidate.profile_picture_url}
              size="md"
            />

            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900 mb-1">
                {candidate.first_name} {candidate.last_name}
              </h3>
              <p className="text-sm text-slate-600">{candidate.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-lg border font-bold text-sm
              ${rating === 'Top Fit' ? 'bg-green-50 border-green-200 text-green-700' :
                rating === 'Maybe' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                rating === 'Not a Fit' ? 'bg-red-50 border-red-200 text-red-700' :
                'bg-slate-50 border-slate-200 text-slate-500'}`}>
              {rating || 'Unrated'}
            </div>

            <button
              onClick={() => togglePayment(candidate.candidate_id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all shadow-sm
                ${isPaymentSelected
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-600'}`}
            >
              {isPaymentSelected ? <CheckSquare size={18} /> : <Square size={18} />}
              <span className="font-bold">{isPaymentSelected ? 'Selected' : 'Select'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-wide font-bold block mb-1">Salary</span>
            <span className="font-semibold text-slate-900">${candidate.minimum_expected_salary_monthly.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-wide font-bold block mb-1">Availability</span>
            <span className="font-semibold text-slate-900">{candidate.availability}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-wide font-bold block mb-1">Location</span>
            <span className="font-semibold text-slate-900">{candidate.current_city || 'N/A'}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-wide font-bold block mb-1">Visa Status</span>
            <span className="font-semibold text-slate-900">{candidate.visa_status}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderSection = (title: string, icon: React.ReactNode, color: 'green' | 'orange' | 'rose', filterFn: (r: MatchResult) => boolean) => {
    const candidates = itemsToShow.filter(filterFn);
    if (candidates.length === 0) return null;

    const colors = {
      green: { border: 'border-green-300', bg: 'bg-green-50/30', header: 'from-green-600 to-green-700', badge: 'bg-green-500' },
      orange: { border: 'border-orange-300', bg: 'bg-orange-50/30', header: 'from-orange-600 to-orange-700', badge: 'bg-orange-500' },
      rose: { border: 'border-red-300', bg: 'bg-red-50/30', header: 'from-red-600 to-red-700', badge: 'bg-red-500' },
    }[color];

    return (
      <Card className={`overflow-hidden border-2 ${colors.border} shadow-md ${colors.bg}`}>
        <div className={`bg-gradient-to-r ${colors.header} text-white p-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            {icon}
            <h3 className="text-xl font-bold">{title}</h3>
          </div>
          <Badge color={color} className={`${colors.badge} text-white px-3 py-1 text-sm font-bold`}>
            {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        <div className="p-6 space-y-4">
          {candidates.map(res => renderCandidateCard(res))}
        </div>
      </Card>
    );
  };

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
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Purchase Candidates from {employer.employer_name}</h1>
            <p className="text-slate-600">{employer.job_title}</p>
          </div>
          <Button variant="secondary" onClick={onBack} className="bg-slate-700 text-white border-transparent hover:bg-slate-800">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Rating
          </Button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <div className="bg-blue-600 text-white rounded-full p-1.5 mt-0.5 shrink-0">
          <span className="font-bold text-base px-1.5">!</span>
        </div>
        <div>
          <p className="text-blue-900/80 text-sm">
            <span className="font-bold">Select candidates to purchase:</span> Review rated candidates below grouped by fit rating. Use the filter buttons to view specific categories, then select candidates you want to purchase.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={() => setActiveFilter('Top Fit')}
          className={`flex items-center gap-3 px-6 py-3 rounded-lg font-bold text-base transition-all shadow-md hover:shadow-lg ${
            activeFilter === 'Top Fit'
              ? 'bg-green-600 text-white scale-105'
              : 'bg-white text-green-700 border-2 border-green-300 hover:border-green-400'
          }`}
        >
          <span>Top Fit</span>
          <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
            activeFilter === 'Top Fit'
              ? 'bg-white text-green-600'
              : 'bg-green-100 text-green-700'
          }`}>
            {topFitCount}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('Maybe')}
          className={`flex items-center gap-3 px-6 py-3 rounded-lg font-bold text-base transition-all shadow-md hover:shadow-lg ${
            activeFilter === 'Maybe'
              ? 'bg-orange-600 text-white scale-105'
              : 'bg-white text-orange-700 border-2 border-orange-300 hover:border-orange-400'
          }`}
        >
          <span>Maybe</span>
          <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
            activeFilter === 'Maybe'
              ? 'bg-white text-orange-600'
              : 'bg-orange-100 text-orange-700'
          }`}>
            {maybeCount}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('Not a Fit')}
          className={`flex items-center gap-3 px-6 py-3 rounded-lg font-bold text-base transition-all shadow-md hover:shadow-lg ${
            activeFilter === 'Not a Fit'
              ? 'bg-red-600 text-white scale-105'
              : 'bg-white text-red-700 border-2 border-red-300 hover:border-red-400'
          }`}
        >
          <span>Not a Fit</span>
          <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
            activeFilter === 'Not a Fit'
              ? 'bg-white text-red-600'
              : 'bg-red-100 text-red-700'
          }`}>
            {notFitCount}
          </span>
        </button>
      </div>

      <div className="pb-24 space-y-8">
        {activeFilter === 'Top Fit' && renderSection('Top Fit', <Check className="w-6 h-6" />, 'green', (r) => candidateRatings[r.candidate.candidate_id] === 'Top Fit')}
        {activeFilter === 'Maybe' && renderSection('Maybe', <Info className="w-6 h-6" />, 'orange', (r) => candidateRatings[r.candidate.candidate_id] === 'Maybe')}
        {activeFilter === 'Not a Fit' && renderSection('Not a Fit', <X className="w-6 h-6" />, 'rose', (r) => candidateRatings[r.candidate.candidate_id] === 'Not a Fit')}

        {paymentIds.size > 0 && (
          <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 sticky bottom-4 z-10 pointer-events-none">
            <Button
              size="lg"
              onClick={() => setIsCheckoutOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-lg rounded-full flex items-center gap-2 font-bold shadow-xl transition-all hover:scale-105 pointer-events-auto"
            >
              <ShoppingCart className="w-5 h-5" />
              Proceed to Checkout ({paymentIds.size})
            </Button>
          </div>
        )}
      </div>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={matchResults.filter(r => paymentIds.has(r.candidate.candidate_id))}
        onProceed={handleCompletePurchase}
      />
    </div>
  );
};
