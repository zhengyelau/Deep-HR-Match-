import React from 'react';
import { Bookmark, Check, X, CheckSquare, Square, ChevronDown } from 'lucide-react';
import { MatchResult } from '../types';

interface CandidateCardProps {
  result: MatchResult;
  rating: string;
  isBookmarked: boolean;
  isPaymentSelected: boolean;
  isShortlistView: boolean;
  onRate: (id: number, rating: string) => void;
  onToggleShortlist: (id: number) => void;
  onTogglePayment: (id: number) => void;
  onRemove: (id: number) => void;
}

const CriteriaItem = ({ label, value, className = '' }: { label: string, value: React.ReactNode, className?: string }) => (
    <div className={`bg-white p-3.5 rounded-lg border border-orange-100 shadow-sm flex flex-col gap-1.5 h-full ${className}`}>
       <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{label}</span>
       <div className="font-bold text-sm text-slate-900 break-words">
           {value ?? '-'}
       </div>
    </div>
);

const QuestionItem = ({ question, answer }: { question: string, answer: string }) => {
    const isYes = answer?.toLowerCase() === 'yes';
    const isNo = answer?.toLowerCase() === 'no';
    const displayAnswer = answer || 'N/A';

    return (
       <div className="bg-white p-3 rounded border border-cyan-100 shadow-sm flex flex-col gap-1">
           <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{question}</span>
           <div className="flex items-center gap-2">
               <span className={`font-semibold ${isYes ? 'text-green-600' : isNo ? 'text-slate-900' : 'text-slate-700'}`}>
                   {displayAnswer}
               </span>
           </div>
       </div>
    );
};

export const CandidateCard: React.FC<CandidateCardProps> = ({
  result,
  rating,
  isBookmarked,
  isPaymentSelected,
  isShortlistView,
  onRate,
  onToggleShortlist,
  onTogglePayment,
  onRemove
}) => {
  const { candidate } = result;
  const q = candidate.questionnaire;

  return (
    <div>
        {/* Candidate Header Row */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-medium shadow-sm overflow-hidden">
                    {candidate.profile_picture_url && candidate.profile_picture_url.length > 5 ? (
                    <img src={candidate.profile_picture_url} alt="Profile" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                    ) : null}
                    <span className={candidate.profile_picture_url && candidate.profile_picture_url.length > 5 ? 'hidden' : ''}>
                        {candidate.first_name[0]}{candidate.last_name[0]}
                    </span>
                </div>
                
                <div>
                    <h3 className="text-2xl font-bold text-slate-900 leading-none mb-2">
                        {candidate.first_name} {candidate.last_name}
                    </h3>
                    <div className="flex items-center gap-3">
                        {/* Rank */}
                        <div className="flex items-center gap-1 text-slate-600 font-medium">
                            Rank: 
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                                {result.rank}
                            </span>
                        </div>
                        <div className="h-4 w-px bg-slate-300 mx-1"></div>
                        {/* Match Score */}
                        <div className="flex items-center gap-1 text-slate-600 font-medium">
                            Match Score:
                            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-sm font-bold">
                                {result.score}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions Right */}
            <div className="flex items-center gap-3 self-end lg:self-auto">
                {/* Rating Dropdown */}
                <div className="relative">
                    <select
                        value={rating}
                        onChange={(e) => onRate(candidate.candidate_id, e.target.value)}
                        className={`
                            appearance-none pl-3 pr-8 py-2 rounded-lg border font-bold text-sm transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm
                            ${rating === 'Top Fit' ? 'bg-green-50 border-green-200 text-green-700 hover:border-green-300' : 
                                rating === 'Maybe' ? 'bg-orange-50 border-orange-200 text-orange-700 hover:border-orange-300' :
                                rating === 'Not a Fit' ? 'bg-red-50 border-red-200 text-red-700 hover:border-red-300' :
                                'bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'}
                        `}
                    >
                        <option value="" disabled>Rate</option>
                        <option value="Top Fit">Top Fit</option>
                        <option value="Maybe">Maybe</option>
                        <option value="Not a Fit">Not a Fit</option>
                    </select>
                    <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${rating ? 'text-current' : 'text-slate-400'}`}>
                        <ChevronDown size={14} />
                    </div>
                </div>

                {/* Bookmark / Shortlist Button */}
                <button 
                    onClick={() => onToggleShortlist(candidate.candidate_id)}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg border transition-all shadow-sm
                        ${isBookmarked 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600'}
                        ${!isBookmarked && (rating === 'Top Fit' || rating === 'Maybe') ? 'pulse-shortlist' : ''}
                    `}
                    title={isBookmarked ? "Remove from Shortlist" : "Add to Shortlist"}
                >
                    <Bookmark size={18} className={isBookmarked ? 'fill-current' : ''} />
                    <span className="font-bold">{isBookmarked ? 'Shortlisted' : 'Shortlist'}</span>
                </button>

                {/* Final Select Button - Only in Shortlist View */}
                {isShortlistView && (
                    <button 
                        onClick={() => onTogglePayment(candidate.candidate_id)}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg border transition-all shadow-sm
                            ${isPaymentSelected 
                                ? 'bg-emerald-600 text-white border-emerald-600' 
                                : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-600'}
                        `}
                        title={isPaymentSelected ? "Selected for Checkout" : "Select for Checkout"}
                    >
                        {isPaymentSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                        <span className="font-bold">{isPaymentSelected ? 'Selected' : 'Select'}</span>
                    </button>
                )}

                {/* Remove X Button - Only in Details view to remove from viewing set */}
                {!isShortlistView && (
                    <button 
                        onClick={() => onRemove(candidate.candidate_id)}
                        className="p-2.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors"
                        title="Remove from View"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>
        </div>

        {/* PURPLE SECTION: Matching Details */}
        <div className="bg-purple-50 rounded-lg border border-purple-100 p-5 mb-4">
            <h4 className="text-lg font-bold text-slate-900 mb-4">Matching Details</h4>
            <h5 className="text-base font-bold text-slate-700 mb-2">Number of Matches</h5>
            
            <div className="mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">PAST & CURRENT</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.details.breakdown.filter(b => b.pastCurrentMatches.length > 0).map((item, idx) => (
                    <div key={idx} className="bg-white rounded-lg border border-purple-100 p-3 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <div className="text-green-600"><Check size={16} /></div>
                                <span className="font-bold text-slate-900 capitalize">{item.category}</span>
                            </div>
                            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded">
                                {item.pastCurrentMatches.length * 3}
                            </span>
                        </div>
                        <div className="space-y-1">
                            {item.pastCurrentMatches.map((m, mIdx) => (
                                <div key={mIdx} className="bg-green-50 border border-green-100 text-green-700 text-sm px-3 py-1.5 rounded-md">
                                    {m}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                {result.details.breakdown.every(b => b.pastCurrentMatches.length === 0) && (
                    <p className="text-sm text-slate-500 italic">No past & current matches.</p>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* ORANGE SECTION: Elimination Criteria */}
            <div className="bg-orange-50 rounded-lg border border-orange-100 p-5 h-full">
                <h4 className="text-lg font-bold text-slate-900 mb-4">Elimination Criteria - basic information</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <CriteriaItem label="Age" value={candidate.age} />
                    <CriteriaItem label="Gender" value={candidate.gender} />
                    <CriteriaItem label="DOB" value={candidate.date_of_birth} />
                    <CriteriaItem label="Nationality" value={candidate.nationality} />
                    <CriteriaItem label="Birth Country" value={candidate.country_of_birth} />
                    <CriteriaItem label="Current Country" value={candidate.current_country} />
                    <CriteriaItem label="Min Salary" value={`$${candidate.minimum_expected_salary_monthly.toLocaleString()}`} />
                    <CriteriaItem label="Availability" value={candidate.availability} />
                    <CriteriaItem label="Visa Status" value={candidate.visa_status} />
                    {candidate.fitness_level && <CriteriaItem label="Fitness" value={candidate.fitness_level} />}
                    {candidate.height_cm && <CriteriaItem label="Height" value={`${candidate.height_cm} cm`} />}
                    {candidate.weight_kg && <CriteriaItem label="Weight" value={`${candidate.weight_kg} kg`} />}
                    <CriteriaItem label="Email" value={candidate.email} className="md:col-span-2 break-all" />
                    <CriteriaItem label="Phone" value={candidate.phone} className="md:col-span-2" />
                </div>
            </div>
            
            {/* CYAN SECTION: Questionnaire */}
            {q && (
                <div className="bg-cyan-50 rounded-lg border border-cyan-100 p-5 h-full">
                    <div className="flex items-center gap-2 mb-4">
                        <h4 className="text-lg font-bold text-slate-900">Elimination Criteria - yes or no question</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <QuestionItem question="Are you willing to work overtime" answer={q.q1_overtime_or_weekends} />
                        <QuestionItem question="Do you have driving License" answer={q.q2_driving_license} />
                        <QuestionItem question="Do you own a car" answer={q.q3_own_car} />
                        <QuestionItem question="Are you willing to travel" answer={q.q4_willing_to_travel} />
                        <QuestionItem question="Do you need disability support" answer={q.q5_disability_support} />
                        <QuestionItem question="Are you willing to relocate" answer={q.q6_willing_to_relocate} />
                        <QuestionItem question="Are you comfortable with background checks" answer={q.q7_comfortable_with_background_checks} />
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};