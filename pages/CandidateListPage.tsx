import React, { useState } from 'react';
import { Search, Filter, ChevronDown, ArrowLeft, Bookmark, ShoppingCart, Activity, Check, Info, X, Network, Zap, PlusCircle } from 'lucide-react';
import { Button, Card, Badge } from '../components/UI';
import { InstructionBanner } from '../components/InstructionBanner';
import { CandidateCard } from '../components/CandidateCard';
import { MatchResult } from '../types';

interface CandidateListPageProps {
  viewMode: 'rating' | 'shortlisting' | 'checkout';
  matchResults: MatchResult[];
  selectedCandidateIds: Set<number>;
  checkoutIds: Set<number>;
  paymentIds: Set<number>;
  candidateRatings: Record<number, string>;
  suggestions: {
      domains: [string, { ids: number[], names: string[], scores: number[] }][];
      functions: [string, { ids: number[], names: string[], scores: number[] }][];
  };
  allRated: boolean;
  onSetViewMode: (mode: 'distribution' | 'rating' | 'shortlisting' | 'checkout' | 'purchased') => void;
  onUpdateRating: (id: number, rating: string) => void;
  onToggleShortlist: (id: number) => void;
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
  checkoutIds,
  paymentIds,
  candidateRatings,
  suggestions,
  allRated,
  onSetViewMode,
  onUpdateRating,
  onToggleShortlist,
  onTogglePayment,
  onRemoveFromView,
  onBatchSelect,
  onProceedToNext,
  onOpenCheckout
}) => {
  const isRatingView = viewMode === 'rating';
  const isShortlistingView = viewMode === 'shortlisting';
  const isCheckoutView = viewMode === 'checkout';

  // Local filter state for Checkout view
  const [checkoutFilterRatings, setCheckoutFilterRatings] = useState<Set<string>>(new Set(['Top Fit', 'Maybe', 'Not a Fit', 'Unrated']));
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Local filter state for Shortlisting view
  const [shortlistFilter, setShortlistFilter] = useState<'Top Fit' | 'Maybe' | 'Not a Fit'>('Top Fit');

  // Filter items logic
  let itemsToShow = matchResults;

  if (isCheckoutView) {
      const isAllSelected = checkoutFilterRatings.size === 4;
      if (!isAllSelected) {
          itemsToShow = itemsToShow.filter(r => {
              const rating = candidateRatings[r.candidate.candidate_id];
              if (checkoutFilterRatings.has('Unrated') && !rating) return true;
              if (rating && checkoutFilterRatings.has(rating)) return true;
              return false;
          });
      }
  }

  if (isShortlistingView) {
      itemsToShow = itemsToShow.filter(r => {
          const rating = candidateRatings[r.candidate.candidate_id];
          return rating === shortlistFilter;
      });
  }

  // Calculate counts for each rating category (for Shortlisting view)
  const topFitCount = isShortlistingView ? matchResults.filter(r => candidateRatings[r.candidate.candidate_id] === 'Top Fit').length : 0;
  const maybeCount = isShortlistingView ? matchResults.filter(r => candidateRatings[r.candidate.candidate_id] === 'Maybe').length : 0;
  const notAFitCount = isShortlistingView ? matchResults.filter(r => candidateRatings[r.candidate.candidate_id] === 'Not a Fit').length : 0;

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
                 isBookmarked={checkoutIds.has(res.candidate.candidate_id)}
                 isPaymentSelected={paymentIds.has(res.candidate.candidate_id)}
                 viewMode={viewMode}
                 onRate={onUpdateRating}
                 onToggleShortlist={onToggleShortlist}
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
            {isRatingView ? 'Rate Candidates' : isShortlistingView ? 'Shortlist Candidates' : 'Purchase Candidate CV'}
          </h2>
          <div className="flex items-center gap-3">
              {isCheckoutView && (
                  <div className="relative mr-2">
                      <button
                          onClick={() => setIsFilterOpen(!isFilterOpen)}
                          className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:border-slate-400 transition-colors shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                          <Filter size={16} className="text-slate-600" />
                          <span className="text-slate-700">Filter</span>
                          <ChevronDown size={14} className={`text-slate-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isFilterOpen && (
                          <div className="absolute right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-50 min-w-[240px] animate-in fade-in slide-in-from-top-2">
                              <div className="space-y-3">
                                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                      <span className="text-sm font-bold text-slate-700">Filter by Rating</span>
                                      {checkoutFilterRatings.size < 4 && (
                                          <button
                                              onClick={() => setCheckoutFilterRatings(new Set(['Top Fit', 'Maybe', 'Not a Fit', 'Unrated']))}
                                              className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                                          >
                                              Reset
                                          </button>
                                      )}
                                  </div>

                                  {['Top Fit', 'Maybe', 'Not a Fit', 'Unrated'].map((rating) => {
                                      const isChecked = checkoutFilterRatings.has(rating);
                                      return (
                                          <label key={rating} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded transition-colors">
                                              <input
                                                  type="checkbox"
                                                  checked={isChecked}
                                                  onChange={(e) => {
                                                      const newSet = new Set(checkoutFilterRatings);
                                                      if (e.target.checked) {
                                                          newSet.add(rating);
                                                      } else {
                                                          newSet.delete(rating);
                                                      }
                                                      setCheckoutFilterRatings(newSet);
                                                  }}
                                                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                              />
                                              <span className={`text-sm font-medium ${
                                                  rating === 'Top Fit' ? 'text-green-700' :
                                                  rating === 'Maybe' ? 'text-orange-700' :
                                                  rating === 'Not a Fit' ? 'text-red-700' :
                                                  'text-slate-700'
                                              }`}>
                                                  {rating}
                                              </span>
                                          </label>
                                      );
                                  })}
                              </div>
                          </div>
                      )}
                  </div>
              )}
              <span className="text-slate-500 text-sm hidden sm:inline">Viewing {itemsToShow.length} candidates</span>
              {isCheckoutView ? (
                <Button variant="secondary" onClick={() => onSetViewMode('shortlisting')} className="bg-slate-700 text-white border-transparent hover:bg-slate-800">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Shortlisting
                </Button>
              ) : isShortlistingView ? (
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

      {/* Filter Buttons - Only on Shortlisting View */}
      {isShortlistingView && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Filter by Rating</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShortlistFilter('Top Fit')}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-base transition-all shadow-sm
                ${shortlistFilter === 'Top Fit'
                  ? 'bg-green-600 text-white border-2 border-green-600 shadow-md scale-105'
                  : 'bg-white text-green-700 border-2 border-green-200 hover:border-green-300 hover:bg-green-50'}
              `}
            >
              <Check size={18} />
              Top Fit
              <span className={`ml-2 px-2 py-0.5 rounded-full text-sm font-bold ${
                shortlistFilter === 'Top Fit'
                  ? 'bg-white/20 text-white'
                  : 'bg-green-100 text-green-800'
              }`}>
                {topFitCount}
              </span>
            </button>

            <button
              onClick={() => setShortlistFilter('Maybe')}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-base transition-all shadow-sm
                ${shortlistFilter === 'Maybe'
                  ? 'bg-orange-600 text-white border-2 border-orange-600 shadow-md scale-105'
                  : 'bg-white text-orange-700 border-2 border-orange-200 hover:border-orange-300 hover:bg-orange-50'}
              `}
            >
              <Info size={18} />
              Maybe
              <span className={`ml-2 px-2 py-0.5 rounded-full text-sm font-bold ${
                shortlistFilter === 'Maybe'
                  ? 'bg-white/20 text-white'
                  : 'bg-orange-100 text-orange-800'
              }`}>
                {maybeCount}
              </span>
            </button>

            <button
              onClick={() => setShortlistFilter('Not a Fit')}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-base transition-all shadow-sm
                ${shortlistFilter === 'Not a Fit'
                  ? 'bg-red-600 text-white border-2 border-red-600 shadow-md scale-105'
                  : 'bg-white text-red-700 border-2 border-red-200 hover:border-red-300 hover:bg-red-50'}
              `}
            >
              <X size={18} />
              Not a Fit
              <span className={`ml-2 px-2 py-0.5 rounded-full text-sm font-bold ${
                shortlistFilter === 'Not a Fit'
                  ? 'bg-white/20 text-white'
                  : 'bg-red-100 text-red-800'
              }`}>
                {notAFitCount}
              </span>
            </button>
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
                      {isCheckoutView && checkoutFilterRatings.size < 4
                          ? "No candidates match the selected filter criteria."
                          : isCheckoutView
                          ? "No candidates have been shortlisted yet. Go back to shortlist candidates first."
                          : "There are no candidates to display in this view."}
                  </p>
                  <div className="flex gap-4">
                      {isCheckoutView && checkoutFilterRatings.size < 4 ? (
                          <Button variant="secondary" onClick={() => setCheckoutFilterRatings(new Set(['Top Fit', 'Maybe', 'Not a Fit', 'Unrated']))}>
                              Clear Filters
                          </Button>
                      ) : isCheckoutView ? (
                          <Button variant="secondary" onClick={() => onSetViewMode('shortlisting')}>
                              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Shortlisting
                          </Button>
                      ) : (
                          <Button variant="secondary" onClick={() => onSetViewMode('distribution')}>
                              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                          </Button>
                      )}
                  </div>
              </div>
            </div>
          </Card>
        ) : isCheckoutView ? (
          // Checkout View: Group by Rating (Only Shortlisted)
          <div className="space-y-8">
            {renderSection('Top Fit', <Check className="w-6 h-6" />, 'green', (r) => candidateRatings[r.candidate.candidate_id] === 'Top Fit')}
            {renderSection('Maybe', <Info className="w-6 h-6" />, 'orange', (r) => candidateRatings[r.candidate.candidate_id] === 'Maybe')}
            {renderSection('Not a Fit', <X className="w-6 h-6" />, 'rose', (r) => candidateRatings[r.candidate.candidate_id] === 'Not a Fit')}
            {renderSection('Unrated', <Activity className="w-6 h-6" />, 'slate', (r) => !candidateRatings[r.candidate.candidate_id])}

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
        ) : isShortlistingView ? (
          // Shortlisting View: Single List (No checkout buttons)
          <Card className="overflow-hidden border border-slate-200 shadow-sm">
            <div className="p-6 md:p-8">
              <div className="space-y-12">
                  {itemsToShow.map((res, index) => (
                      <div key={res.candidate.candidate_id} className={index > 0 ? "pt-12 border-t border-slate-200" : ""}>
                          <CandidateCard
                            result={res}
                            rating={candidateRatings[res.candidate.candidate_id] || ''}
                            isBookmarked={checkoutIds.has(res.candidate.candidate_id)}
                            isPaymentSelected={paymentIds.has(res.candidate.candidate_id)}
                            viewMode={viewMode}
                            onRate={onUpdateRating}
                            onToggleShortlist={onToggleShortlist}
                            onTogglePayment={onTogglePayment}
                          />
                      </div>
                  ))}
              </div>

              {checkoutIds.size > 0 && (
                <div className="mt-8 pt-8 border-t border-slate-100 flex justify-end animate-in fade-in slide-in-from-bottom-2 sticky bottom-4 z-10 pointer-events-none">
                    <Button
                      size="lg"
                      onClick={onProceedToNext}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg rounded-full flex items-center gap-2 font-bold shadow-xl transition-all hover:scale-105 pointer-events-auto"
                  >
                      <Bookmark className="w-5 h-5 fill-current" />
                      Proceed to Final Selection ({checkoutIds.size})
                  </Button>
                </div>
              )}

              {checkoutIds.size === 0 && (
                <div className="mt-8 pt-8 border-t border-slate-100 bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <p className="text-yellow-800 font-semibold text-lg mb-2">Please shortlist at least one candidate</p>
                    <p className="text-yellow-700 text-sm">Click the Shortlist button on candidates you want to proceed with.</p>
                </div>
              )}
            </div>
          </Card>
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
                            isBookmarked={checkoutIds.has(res.candidate.candidate_id)}
                            isPaymentSelected={paymentIds.has(res.candidate.candidate_id)}
                            viewMode={viewMode}
                            onRate={onUpdateRating}
                            onToggleShortlist={onToggleShortlist}
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
                      <Bookmark className="w-5 h-5" />
                      Proceed to purchase candidates
                  </Button>
                </div>
              )}

              {itemsToShow.length > 0 && !allRated && (
                <div className="mt-8 pt-8 border-t border-slate-100 bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <p className="text-yellow-800 font-semibold text-lg mb-2">Please rate all candidates before proceeding</p>
                    <p className="text-yellow-700 text-sm">You need to assign a rating to each candidate to continue to shortlisting.</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};