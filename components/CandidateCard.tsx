import React, { useState } from 'react';
import { Bookmark, Check, CheckSquare, Square, ChevronDown } from 'lucide-react';
import { MatchResult } from '../types';
import { Avatar } from './Avatar';

interface CandidateCardProps {
  result: MatchResult;
  rating: string;
  isPaymentSelected: boolean;
  viewMode: 'rating' | 'checkout';
  onRate: (id: number, rating: string) => void;
  onTogglePayment: (id: number) => void;
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
  isPaymentSelected,
  viewMode,
  onRate,
  onTogglePayment
}) => {
  const { candidate } = result;
  const q = candidate.questionnaire;
  const isRatingView = viewMode === 'rating';
  const isCheckoutView = viewMode === 'checkout';

  const [expandBasicInfo, setExpandBasicInfo] = useState(false);
  const [expandQuestionnaire, setExpandQuestionnaire] = useState(false);

  return (
    <div>
        {/* Candidate Header Row */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
                <Avatar
                    candidateId={candidate.candidate_id}
                    firstName={candidate.first_name}
                    lastName={candidate.last_name}
                    profilePictureUrl={candidate.profile_picture_url}
                    size="lg"
                />

                <div>
                    <h3 className="text-2xl font-bold text-slate-900 leading-none mb-3">
                        {candidate.first_name} {candidate.last_name}
                    </h3>
                    <div className="flex items-center gap-5">
                        {/* Rank */}
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Rank</span>
                            <span className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-lg font-bold flex items-center justify-center shadow-md">
                                {result.rank}
                            </span>
                        </div>
                        <div className="h-12 w-px bg-slate-300"></div>
                        {/* Match Score */}
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Match Score</span>
                            <span className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white text-lg font-bold shadow-md">
                                {result.score}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions Right */}
            <div className="flex items-center gap-3 self-end lg:self-auto">
                {/* Rating Dropdown - Only in Rating View */}
                {isRatingView && (
                    <div className="relative">
                        <div className="absolute -top-8 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-lg whitespace-nowrap z-10 animate-pulse">
                            Indicate Fit Here
                        </div>
                        <select
                            value={rating}
                            onChange={(e) => onRate(candidate.candidate_id, e.target.value)}
                            className={`
                                appearance-none pl-5 pr-12 py-3.5 rounded-lg border-2 font-bold text-lg transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg min-w-[180px]
                                ${rating === 'Top Fit' ? 'bg-green-50 border-green-300 text-green-700 hover:border-green-400' :
                                    rating === 'Maybe' ? 'bg-orange-50 border-orange-300 text-orange-700 hover:border-orange-400' :
                                    rating === 'Not a Fit' ? 'bg-red-50 border-red-300 text-red-700 hover:border-red-400' :
                                    'bg-white border-blue-400 text-slate-500 hover:border-blue-500 hover:text-blue-600 ring-2 ring-blue-200'}
                            `}
                        >
                            <option value="" disabled>Rate This Candidate</option>
                            <option value="Top Fit">Top Fit</option>
                            <option value="Maybe">Maybe</option>
                            <option value="Not a Fit">Not a Fit</option>
                        </select>
                        <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 ${rating ? 'text-current' : 'text-slate-400'}`}>
                            <ChevronDown size={18} />
                        </div>
                    </div>
                )}

                {/* Rating Badge - Display only in Checkout View */}
                {isCheckoutView && (
                    <div className={`
                        px-4 py-2 rounded-lg border font-bold text-sm
                        ${rating === 'Top Fit' ? 'bg-green-50 border-green-200 text-green-700' :
                            rating === 'Maybe' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                            rating === 'Not a Fit' ? 'bg-red-50 border-red-200 text-red-700' :
                            'bg-slate-50 border-slate-200 text-slate-500'}
                    `}>
                        {rating || 'Unrated'}
                    </div>
                )}

                {/* Final Select Button - Only in Checkout View */}
                {isCheckoutView && (
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
            </div>
        </div>

        {/* PURPLE SECTION: Matching Details */}
        <div className="bg-purple-50 rounded-lg border border-purple-100 p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-slate-900">Matching Details</h4>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">PAST & CURRENT</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {result.details.breakdown.filter(b => b.pastCurrentMatches.length > 0).map((item, idx) => (
                    <div key={idx} className="bg-white rounded border border-purple-100 p-3 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-1.5">
                                <div className="text-green-600"><Check size={16} /></div>
                                <span className="font-bold text-sm text-slate-900 capitalize leading-tight">{item.category}</span>
                            </div>
                            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded">
                                {item.pastCurrentMatches.length * 3}
                            </span>
                        </div>
                        <div className="space-y-1">
                            {item.pastCurrentMatches.map((m, mIdx) => (
                                <div key={mIdx} className="bg-green-50 border border-green-100 text-green-700 text-xs px-2 py-1 rounded leading-tight">
                                    {m}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                {result.details.breakdown.every(b => b.pastCurrentMatches.length === 0) && (
                    <p className="text-sm text-slate-500 italic col-span-full">No past & current matches.</p>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* ORANGE SECTION: Elimination Criteria */}
            <div className="bg-orange-50 rounded-lg border border-orange-100 h-full">
                <button
                    onClick={() => setExpandBasicInfo(!expandBasicInfo)}
                    className="w-full flex items-center justify-between p-5 cursor-pointer hover:bg-orange-100/50 transition-colors rounded-t-lg"
                >
                    <h4 className="text-lg font-bold text-slate-900">Elimination Criteria - basic information</h4>
                    <ChevronDown
                        size={22}
                        className={`text-orange-600 transition-transform duration-200 flex-shrink-0 ${expandBasicInfo ? 'rotate-180' : ''}`}
                    />
                </button>
                {expandBasicInfo && (
                    <div className="px-5 pb-5 pt-3 border-t border-orange-100">
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
                )}
            </div>
            
            {/* CYAN SECTION: Questionnaire */}
            {q && (
                <div className="bg-cyan-50 rounded-lg border border-cyan-100 h-full">
                    <button
                        onClick={() => setExpandQuestionnaire(!expandQuestionnaire)}
                        className="w-full flex items-center justify-between p-5 cursor-pointer hover:bg-cyan-100/50 transition-colors rounded-t-lg"
                    >
                        <h4 className="text-lg font-bold text-slate-900">Elimination Criteria - yes or no question</h4>
                        <ChevronDown
                            size={22}
                            className={`text-cyan-600 transition-transform duration-200 flex-shrink-0 ${expandQuestionnaire ? 'rotate-180' : ''}`}
                        />
                    </button>
                    {expandQuestionnaire && (
                        <div className="px-5 pb-5 pt-5 border-t border-cyan-100">
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
            )}
        </div>
    </div>
  );
};