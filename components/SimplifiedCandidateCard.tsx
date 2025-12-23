import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { MatchResult } from '../types';
import { Avatar } from './Avatar';

interface SimplifiedCandidateCardProps {
  result: MatchResult;
  rating: string;
  onRate: (id: number, rating: string) => void;
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

export const SimplifiedCandidateCard: React.FC<SimplifiedCandidateCardProps> = ({
  result,
  rating,
  onRate
}) => {
  const { candidate } = result;
  const q = candidate.questionnaire;

  const [expandBasicInfo, setExpandBasicInfo] = useState(true);
  const [expandQuestionnaire, setExpandQuestionnaire] = useState(true);

  return (
    <div>
        {/* Candidate Header Row - No Rank or Match Score */}
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
                </div>
            </div>

            {/* Rating Dropdown */}
            <div className="flex items-center gap-3 self-end lg:self-auto">
                <div className="relative">
                    <div className="absolute -top-8 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-lg whitespace-nowrap z-10 animate-pulse">
                        Indicate Fit Here
                    </div>
                    <select
                        value={rating}
                        onChange={(e) => onRate(candidate.candidate_id, e.target.value)}
                        className={`
                            appearance-none pl-5 pr-12 py-3.5 rounded-lg border-2 font-bold text-lg transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg min-w-[180px]
                            ${rating === 'Top 10' ? 'bg-green-50 border-green-300 text-green-700 hover:border-green-400' :
                                rating === 'Top 20' ? 'bg-cyan-50 border-cyan-300 text-cyan-700 hover:border-cyan-400' :
                                rating === 'Top 50' ? 'bg-orange-50 border-orange-300 text-orange-700 hover:border-orange-400' :
                                rating === 'Top 100' ? 'bg-slate-50 border-slate-300 text-slate-700 hover:border-slate-400' :
                                'bg-white border-blue-400 text-slate-500 hover:border-blue-500 hover:text-blue-600 ring-2 ring-blue-200'}
                        `}
                    >
                        <option value="" disabled>Rate This Candidate</option>
                        <option value="Top 10">Top 10</option>
                        <option value="Top 20">Top 20</option>
                        <option value="Top 50">Top 50</option>
                        <option value="Top 100">Top 100</option>
                    </select>
                    <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 ${rating ? 'text-current' : 'text-slate-400'}`}>
                        <ChevronDown size={18} />
                    </div>
                </div>
            </div>
        </div>

        {/* NO MATCHING DETAILS SECTION - Removed as per requirements */}

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
