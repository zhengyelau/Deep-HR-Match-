import React, { useState, useMemo } from 'react';
import { Search, ArrowLeft, ShoppingCart, Check, Info, X, FileCheck } from 'lucide-react';
import { Button, Card, Badge } from '../components/UI';
import { InstructionBanner } from '../components/InstructionBanner';
import { CandidateCard } from '../components/CandidateCard';
import { MatchResult } from '../types';

interface CandidateListPageProps {
  viewMode: 'rating' | 'checkout';
  matchResults: MatchResult[];
  selectedCandidateIds: Set<number>;
  paymentIds: Set<number>;
  candidateRatings: Record<number, string>;
  purchasedCandidateIds: Set<number>;
  jobId: number;
  suggestions: {
      domains: [string, { ids: number[], names: string[], scores: number[] }][];
      functions: [string, { ids: number[], names: string[], scores: number[] }][];
  };
  allRated: boolean;
  onSetViewMode: (mode: 'distribution' | 'rating' | 'checkout' | 'purchased' | 'shortlisted') => void;
  onUpdateRating: (id: number, rating: string) => void;
  onTogglePayment: (id: number) => void;
  onRemoveFromView: (id: number) => void;
  onBatchSelect: (ids: number[]) => void;
  onProceedToNext: () => void;
  onOpenCheckout: () => void;
}

export const CandidateListPage: React.FC<CandidateListPageProps> = ({
  viewMode,
  matchResults,
  selectedCandidateIds,
  paymentIds,
  candidateRatings,
  purchasedCandidateIds,
  jobId,
  suggestions,
  allRated,
  onSetViewMode,
  onUpdateRating,
  onTogglePayment,
  onRemoveFromView,
  onBatchSelect,
  onProceedToNext,
  onOpenCheckout
}) => {
  const isRatingView = viewMode === 'rating';
  const isCheckoutView = viewMode === 'checkout';

  // Local filter state for Checkout view
  const [activeFilter, setActiveFilter] = useState<'Top Fit' | 'Maybe' | 'Not a Fit'>('Top Fit');

  // Calculate counts for each category
  const topFitCount = matchResults.filter(r => candidateRatings[r.candidate.candidate_id] === 'Top Fit').length;
  const maybeCount = matchResults.filter(r => candidateRatings[r.candidate.candidate_id] === 'Maybe').length;
  const notFitCount = matchResults.filter(r => candidateRatings[r.candidate.candidate_id] === 'Not a Fit').length;

  // Filter items logic
  let itemsToShow = matchResults;

  if (isCheckoutView) {
      itemsToShow = itemsToShow.filter(r => {
          const rating = candidateRatings[r.candidate.candidate_id];
          return rating === activeFilter;
      });
  }

  // Check if all rated candidates are already purchased
  const allRatedCandidatesArePurchased = useMemo(() => {
    if (!isCheckoutView) return false;

    // Get all candidates with ratings (Top Fit, Maybe, Not a Fit)
    const ratedCandidates = matchResults.filter(r => {
      const rating = candidateRatings[r.candidate.candidate_id];
      return rating === 'Top Fit' || rating === 'Maybe' || rating === 'Not a Fit';
    });

    // If no rated candidates, return false
    if (ratedCandidates.length === 0) return false;

    // Check if all rated candidates are purchased
    return ratedCandidates.every(r => purchasedCandidateIds.has(r.candidate.candidate_id));
  }, [isCheckoutView, matchResults, candidateRatings, purchasedCandidateIds]);

  // Helper to render sections in Checkout mode
  const renderSection = (title: string, icon: React.ReactNode, color: 'green' | 'orange' | 'rose' | 'slate', filterFn: (r: MatchResult) => boolean) => {
    const candidates = itemsToShow.filter(filterFn);
    if (candidates.length === 0) return null;

    const colors = {
      green: { border: 'border-green-300', bg: 'bg-green-50/30', header: 'from-green-600 to-green-700', badge: 'bg-green-500' },
      orange: { border: 'border-orange-300', bg: 'bg-orange-50/30', header: 'from-orange-600 to-orange-700', badge: 'bg-orange-500' },
      rose: { border: 'border-red-300', bg: 'bg-red-50/30', header: 'from-red-600 to-red-700', badge: 'bg-red-500' },
      slate: { border: 'border-slate-300', bg: 'bg-slate-50/30', header: 'from-slate-600 to-slate-700', badge: 'bg-slate-500' },
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
        <div className="p-6 space-y-12">
          {candidates.map((res, index) => (
             <div key={res.candidate.candidate_id} className={index > 0 ? `pt-12 border-t border-${color === 'rose' ? 'red' : color}-200` : ""}>
               <CandidateCard
                 result={res}
                 rating={candidateRatings[res.candidate.candidate_id] || ''}
                 isPaymentSelected={paymentIds.has(res.candidate.candidate_id)}
                 isPurchased={purchasedCandidateIds.has(res.candidate.candidate_id)}
                 viewMode={viewMode}
                 onRate={onUpdateRating}
                 onTogglePayment={onTogglePayment}
               />
             </div>
          ))}
        </div>
      </Card>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 1. Header Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-slate-900">
            {isRatingView ? 'Indicate Candidates Fit' : 'Purchase Candidate CV'}
          </h2>
          <div className="flex items-center gap-3">
              {isCheckoutView ? (
                <Button variant="secondary" onClick={() => onSetViewMode('rating')} className="bg-slate-700 text-white border-transparent hover:bg-slate-800">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Rating
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => onSetViewMode('distribution')} className="bg-slate-700 text-white border-transparent hover:bg-slate-800">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Distribution
                </Button>
              )}
          </div>
      </div>

      <InstructionBanner viewMode={viewMode} />

      {/* Filter Toggle Buttons - Only on Checkout View */}
      {isCheckoutView && (
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
      )}

      {/* Discover Similar Candidates - Only on Rating View */}
      {/* {isRatingView && (suggestions.domains.length > 0 || suggestions.functions.length > 0) && (
          <div className="bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 border border-blue-200 rounded-2xl p-8 mb-8 animate-in fade-in slide-in-from-top-4 shadow-sm">
              <div className="flex items-start justify-between mb-6">
                  <div>
                      <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-blue-600 text-white rounded-lg shadow-md">
                              <Search size={24} />
                          </div>
                          <h3 className="text-2xl font-bold text-slate-900">Discover Similar Candidates</h3>
                      </div>
                      <p className="text-base text-slate-700 max-w-3xl leading-relaxed">
                            Expand your candidate pool by exploring groups with similar backgrounds, skills, and attributes.
                            <span className="font-semibold text-blue-800"> Click any category below to instantly add those candidates to your selection.</span>
                      </p>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {suggestions.domains.length > 0 && (
                      <div className="bg-white rounded-xl p-5 border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-2 mb-4">
                              <Network size={18} className="text-amber-600" />
                              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Domain Knowledge</h4>
                          </div>
                          <div className="flex flex-wrap gap-2">
                              {suggestions.domains.map(([domain, data]) => {
                                  const avgScore = Math.round(data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length);
                                  return (
                                      <div key={domain} className="group relative">
                                          <button
                                              onClick={() => onBatchSelect(data.ids)}
                                              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 text-amber-900 rounded-lg text-sm font-semibold hover:from-amber-100 hover:to-amber-200 hover:border-amber-300 transition-all shadow-sm hover:shadow-md active:scale-95"
                                          >
                                              <span className="line-clamp-1">{domain}</span>
                                              <div className="flex items-center gap-1.5">
                                                  <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full text-xs font-bold">
                                                      {data.ids.length}
                                                  </span>
                                                  <PlusCircle size={16} className="text-amber-700" />
                                              </div>
                                          </button>
                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
                                              <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap max-w-xs">
                                                  <div className="font-bold mb-1">Avg Score: {avgScore}</div>
                                                  <div className="text-slate-300 text-[10px] max-h-20 overflow-y-auto">
                                                      {data.names.slice(0, 5).join(', ')}
                                                      {data.names.length > 5 && ` +${data.names.length - 5} more`}
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                  )}

                  {suggestions.functions.length > 0 && (
                      <div className="bg-white rounded-xl p-5 border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-2 mb-4">
                              <Zap size={18} className="text-rose-600" />
                              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Functional Skills</h4>
                          </div>
                          <div className="flex flex-wrap gap-2">
                              {suggestions.functions.map(([func, data]) => {
                                  const avgScore = Math.round(data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length);
                                  return (
                                      <div key={func} className="group relative">
                                          <button
                                              onClick={() => onBatchSelect(data.ids)}
                                              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-rose-50 to-rose-100 border-2 border-rose-200 text-rose-900 rounded-lg text-sm font-semibold hover:from-rose-100 hover:to-rose-200 hover:border-rose-300 transition-all shadow-sm hover:shadow-md active:scale-95"
                                          >
                                              <span className="line-clamp-1">{func}</span>
                                              <div className="flex items-center gap-1.5">
                                                  <span className="bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full text-xs font-bold">
                                                      {data.ids.length}
                                                  </span>
                                                  <PlusCircle size={16} className="text-rose-700" />
                                              </div>
                                          </button>
                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
                                              <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap max-w-xs">
                                                  <div className="font-bold mb-1">Avg Score: {avgScore}</div>
                                                  <div className="text-slate-300 text-[10px] max-h-20 overflow-y-auto">
                                                      {data.names.slice(0, 5).join(', ')}
                                                      {data.names.length > 5 && ` +${data.names.length - 5} more`}
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}

      */}

      {/* Stats Cards - Only on Rating View */}
      {isRatingView && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 shadow-sm">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">NUMBER OF CANDIDATES</h4>
            <p className="text-4xl font-bold text-emerald-800">{itemsToShow.length}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 shadow-sm">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">LOWEST MATCH SCORE</h4>
            <p className="text-4xl font-bold text-orange-700">
                {itemsToShow.length > 0 ? Math.min(...itemsToShow.map(m => m.score)) : 0}
            </p>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 shadow-sm">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">HIGHEST MATCH SCORE</h4>
            <p className="text-4xl font-bold text-rose-700">
                {itemsToShow.length > 0 ? Math.max(...itemsToShow.map(m => m.score)) : 0}
            </p>
        </div>
      </div>
      )}

      {/* Candidates List Area */}
      <div className="pb-24">
        {itemsToShow.length === 0 ? (
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
                      {isCheckoutView
                          ? `No candidates were rated as "${activeFilter}". Try selecting a different category above.`
                          : "There are no candidates to display in this view."}
                  </p>
                  <div className="flex gap-4">
                      <Button variant="secondary" onClick={() => onSetViewMode('rating')}>
                          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Rating
                      </Button>
                  </div>
              </div>
            </div>
          </Card>
        ) : isCheckoutView ? (
          // Checkout View: Show filtered section based on activeFilter
          <div className="space-y-8">
            {activeFilter === 'Top Fit' && renderSection('Top Fit', <Check className="w-6 h-6" />, 'green', (r) => candidateRatings[r.candidate.candidate_id] === 'Top Fit')}
            {activeFilter === 'Maybe' && renderSection('Maybe', <Info className="w-6 h-6" />, 'orange', (r) => candidateRatings[r.candidate.candidate_id] === 'Maybe')}
            {activeFilter === 'Not a Fit' && renderSection('Not a Fit', <X className="w-6 h-6" />, 'rose', (r) => candidateRatings[r.candidate.candidate_id] === 'Not a Fit')}

            {allRatedCandidatesArePurchased && (
                <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-8 animate-in fade-in slide-in-from-bottom-2">
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
                            onClick={() => onSetViewMode('purchased')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg rounded-lg flex items-center gap-2 font-bold shadow-lg transition-all hover:scale-105 shrink-0"
                        >
                            <FileCheck className="w-5 h-5" />
                            Review Purchased CVs
                        </Button>
                    </div>
                </div>
            )}

            {paymentIds.size > 0 && (
                <div className="mt-8 flex justify-end animate-in fade-in slide-in-from-bottom-2 sticky bottom-4 z-10 pointer-events-none">
                    <Button
                      size="lg"
                      onClick={onOpenCheckout}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-lg rounded-full flex items-center gap-2 font-bold shadow-xl transition-all hover:scale-105 pointer-events-auto"
                  >
                      <ShoppingCart className="w-5 h-5" />
                      Proceed to Checkout ({paymentIds.size})
                  </Button>
                </div>
            )}
          </div>
        ) : (
          // Rating View: Single List
          <Card className="overflow-hidden border border-slate-200 shadow-sm">
            <div className="p-6 md:p-8">
              <div className="space-y-12">
                  {itemsToShow.map((res, index) => (
                      <div key={res.candidate.candidate_id} className={index > 0 ? "pt-12 border-t border-slate-200" : ""}>
                          <CandidateCard
                            result={res}
                            rating={candidateRatings[res.candidate.candidate_id] || ''}
                            isPaymentSelected={paymentIds.has(res.candidate.candidate_id)}
                            isPurchased={purchasedCandidateIds.has(res.candidate.candidate_id)}
                            viewMode={viewMode}
                            onRate={onUpdateRating}
                            onTogglePayment={onTogglePayment}
                          />
                      </div>
                  ))}
              </div>

              {itemsToShow.length > 0 && allRated && (
                <div className="mt-8 pt-8 border-t border-slate-100 flex justify-end animate-in fade-in slide-in-from-bottom-2 sticky bottom-4 z-10 pointer-events-none">
                    <Button
                      size="lg"
                      onClick={onProceedToNext}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg rounded-full flex items-center gap-2 font-bold shadow-xl transition-all hover:scale-105 pointer-events-auto"
                  >
                      <ShoppingCart className="w-5 h-5" />
                      Proceed to purchase candidates
                  </Button>
                </div>
              )}

              {itemsToShow.length > 0 && !allRated && (
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