import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ShoppingCart, Check, Info, X, CheckSquare, Square, ShieldCheck, FileCheck, ArrowRight } from 'lucide-react';
import { Button, Card, Badge } from '../components/UI';
import { Avatar } from '../components/Avatar';
import { MatchResult, Employer } from '../types';
import { candidatesService } from '../services/candidatesService';
import { matchResultsService } from '../services/matchResultsService';
import { candidateEvaluationService } from '../services/candidateEvaluationService';
import { CheckoutModal } from '../components/CheckoutModal';
import { purchasedCandidatesService } from '../services/purchasedCandidatesService';

interface PeopleFromCompanyPurchasePageProps {
  companyName: string;
  jobId: number;
  employer: Employer;
  onBack: () => void;
  onPurchaseComplete: () => void;
  onNavigateToPurchased?: () => void;
}

export const PeopleFromCompanyPurchasePage: React.FC<PeopleFromCompanyPurchasePageProps> = ({
  companyName,
  jobId,
  employer,
  onBack,
  onPurchaseComplete,
  onNavigateToPurchased
}) => {
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [candidateRatings, setCandidateRatings] = useState<Record<number, string>>({});
  const [paymentIds, setPaymentIds] = useState<Set<number>>(new Set());
  const [purchasedCandidateIds, setPurchasedCandidateIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'Top 10' | 'Top 20' | 'Top 50' | 'Top 100'>('Top 10');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const allCandidates = await candidatesService.getCandidates();

        // Filter candidates by company name
        const filteredCandidates = allCandidates.filter(candidate =>
          candidate.past_employer_1?.toLowerCase() === companyName.toLowerCase()
        );

        // Create MatchResult objects without actual scoring
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

        // Load evaluations if available (optional since we're filtering by company)
        const evaluations = await candidateEvaluationService.getEvaluationsByJobId(jobId);
        const ratings: Record<number, string> = {};
        results.forEach(r => {
          const candidateId = r.candidate.candidate_id;
            if (evaluations[candidateId]?.rating) {
              ratings[candidateId] = evaluations[candidateId].rating;
            }
          });
          setCandidateRatings(ratings);

        // Load purchased candidates for this job
        const purchased = await purchasedCandidatesService.getPurchasedCandidatesByJobId(jobId);
        const purchasedIds = new Set(purchased.map(p => p.candidate_id));
        setPurchasedCandidateIds(purchasedIds);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [companyName, jobId]);

  const togglePayment = (id: number) => {
    const next = new Set(paymentIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPaymentIds(next);
  };

  const handleCompletePurchase = async () => {
    const candidateIdsToPurchase = Array.from(paymentIds);
    const success = await purchasedCandidatesService.purchaseCandidates(jobId, candidateIdsToPurchase);

    if (success) {
      setIsCheckoutOpen(false);
      onPurchaseComplete();
    }
  };

  // Calculate individual counts
  const top10OnlyCount = matchResults.filter(r => candidateRatings[r.candidate.candidate_id] === 'Top 10').length;
  const top20OnlyCount = matchResults.filter(r => candidateRatings[r.candidate.candidate_id] === 'Top 20').length;
  const top50OnlyCount = matchResults.filter(r => candidateRatings[r.candidate.candidate_id] === 'Top 50').length;
  const top100OnlyCount = matchResults.filter(r => candidateRatings[r.candidate.candidate_id] === 'Top 100').length;

  // Calculate cumulative counts for display
  const top10Count = top10OnlyCount;
  const top20Count = top10OnlyCount + top20OnlyCount;
  const top50Count = top10OnlyCount + top20OnlyCount + top50OnlyCount;
  const top100Count = top10OnlyCount + top20OnlyCount + top50OnlyCount + top100OnlyCount;

  // Cumulative filtering
  const itemsToShow = matchResults.filter(r => {
    const rating = candidateRatings[r.candidate.candidate_id];
    if (activeFilter === 'Top 10') {
      return rating === 'Top 10';
    } else if (activeFilter === 'Top 20') {
      return rating === 'Top 10' || rating === 'Top 20';
    } else if (activeFilter === 'Top 50') {
      return rating === 'Top 10' || rating === 'Top 20' || rating === 'Top 50';
    } else if (activeFilter === 'Top 100') {
      return rating === 'Top 10' || rating === 'Top 20' || rating === 'Top 50' || rating === 'Top 100';
    }
    return false;
  });

  // Check if all rated candidates are already purchased
  const allRatedCandidatesArePurchased = useMemo(() => {
    const ratedCandidates = matchResults.filter(r => {
      const rating = candidateRatings[r.candidate.candidate_id];
      return rating === 'Top 10' || rating === 'Top 20' || rating === 'Top 50' || rating === 'Top 100';
    });

    if (ratedCandidates.length === 0) return false;

    return ratedCandidates.every(r => purchasedCandidateIds.has(r.candidate.candidate_id));
  }, [matchResults, candidateRatings, purchasedCandidateIds]);

  const renderCandidateCard = (res: MatchResult) => {
    const { candidate } = res;
    const isPaymentSelected = paymentIds.has(candidate.candidate_id);
    const isPurchased = purchasedCandidateIds.has(candidate.candidate_id);
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
              ${rating === 'Top 10' ? 'bg-green-50 border-green-200 text-green-700' :
                rating === 'Top 20' ? 'bg-cyan-50 border-cyan-200 text-cyan-700' :
                rating === 'Top 50' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                rating === 'Top 100' ? 'bg-slate-50 border-slate-200 text-slate-700' :
                'bg-slate-50 border-slate-200 text-slate-500'}`}>
              {rating || 'Unrated'}
            </div>

            {isPurchased ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-300 bg-blue-50 text-blue-700 shadow-sm">
                <ShieldCheck size={18} />
                <span className="font-bold">Already Purchased</span>
              </div>
            ) : (
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
            )}
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
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Purchase Candidates from {companyName}</h1>
            <p className="text-slate-600">For position: {employer.job_title}</p>
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

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setActiveFilter('Top 10')}
            className={`flex items-center gap-3 px-6 py-3 rounded-lg font-bold text-base transition-all shadow-md hover:shadow-lg ${
              activeFilter === 'Top 10'
                ? 'bg-green-600 text-white scale-105'
                : 'bg-white text-green-700 border-2 border-green-300 hover:border-green-400'
            }`}
          >
            <span>Top 10</span>
            <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
              activeFilter === 'Top 10'
                ? 'bg-white text-green-600'
                : 'bg-green-100 text-green-700'
            }`}>
              {top10Count}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('Top 20')}
            className={`flex items-center gap-3 px-6 py-3 rounded-lg font-bold text-base transition-all shadow-md hover:shadow-lg ${
              activeFilter === 'Top 20'
                ? 'bg-cyan-600 text-white scale-105'
                : 'bg-white text-cyan-700 border-2 border-cyan-300 hover:border-cyan-400'
            }`}
          >
            <span>Top 20</span>
            <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
              activeFilter === 'Top 20'
                ? 'bg-white text-cyan-600'
                : 'bg-cyan-100 text-cyan-700'
            }`}>
              {top20Count}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('Top 50')}
            className={`flex items-center gap-3 px-6 py-3 rounded-lg font-bold text-base transition-all shadow-md hover:shadow-lg ${
              activeFilter === 'Top 50'
                ? 'bg-orange-600 text-white scale-105'
                : 'bg-white text-orange-700 border-2 border-orange-300 hover:border-orange-400'
            }`}
          >
            <span>Top 50</span>
            <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
              activeFilter === 'Top 50'
                ? 'bg-white text-orange-600'
                : 'bg-orange-100 text-orange-700'
            }`}>
              {top50Count}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('Top 100')}
            className={`flex items-center gap-3 px-6 py-3 rounded-lg font-bold text-base transition-all shadow-md hover:shadow-lg ${
              activeFilter === 'Top 100'
                ? 'bg-slate-600 text-white scale-105'
                : 'bg-white text-slate-700 border-2 border-slate-300 hover:border-slate-400'
            }`}
          >
            <span>Top 100</span>
            <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
              activeFilter === 'Top 100'
                ? 'bg-white text-slate-600'
                : 'bg-slate-100 text-slate-700'
            }`}>
              {top100Count}
            </span>
          </button>
        </div>
        
        {/* Next XX Button - Only show when not on Top 100 */}
        {activeFilter !== 'Top 100' && (
          <Button
            onClick={() => {
              if (activeFilter === 'Top 10') setActiveFilter('Top 20');
              else if (activeFilter === 'Top 20') setActiveFilter('Top 50');
              else if (activeFilter === 'Top 50') setActiveFilter('Top 100');
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-base rounded-lg flex items-center gap-2 font-bold shadow-lg transition-all hover:scale-105"
          >
            Next {activeFilter === 'Top 10' ? '10' : activeFilter === 'Top 20' ? '20' : '50'}
            <ArrowRight className="w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="pb-24 space-y-8">
        {/* Cumulative section rendering */}
        {(activeFilter === 'Top 10' || activeFilter === 'Top 20' || activeFilter === 'Top 50' || activeFilter === 'Top 100') &&
          renderSection('Top 10', <Check className="w-6 h-6" />, 'green', (r) => candidateRatings[r.candidate.candidate_id] === 'Top 10')}

        {(activeFilter === 'Top 20' || activeFilter === 'Top 50' || activeFilter === 'Top 100') &&
          renderSection('Top 20', <Check className="w-6 h-6" />, 'green', (r) => candidateRatings[r.candidate.candidate_id] === 'Top 20')}

        {(activeFilter === 'Top 50' || activeFilter === 'Top 100') &&
          renderSection('Top 50', <Info className="w-6 h-6" />, 'orange', (r) => candidateRatings[r.candidate.candidate_id] === 'Top 50')}

        {activeFilter === 'Top 100' &&
          renderSection('Top 100', <X className="w-6 h-6" />, 'rose', (r) => candidateRatings[r.candidate.candidate_id] === 'Top 100')}

        {allRatedCandidatesArePurchased && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-8 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="bg-blue-600 text-white p-3 rounded-lg shrink-0">
                  <FileCheck size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    All Rated Candidates Already Purchased
                  </h3>
                  <p className="text-slate-600">
                    All candidates with ratings have been purchased previously. You can proceed to review their CVs and manage interview shortlists.
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                onClick={onNavigateToPurchased}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg rounded-lg flex items-center gap-2 font-bold shadow-lg transition-all hover:scale-105 shrink-0"
              >
                <FileCheck className="w-5 h-5" />
                Review Purchased CVs
              </Button>
            </div>
          </div>
        )}

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