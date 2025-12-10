import React, { useRef } from 'react';
import { ArrowLeft, Eye } from 'lucide-react';
import { Button } from '../components/UI';
import { Histogram } from '../components/Charts';
import { InstructionBanner } from '../components/InstructionBanner';
import { ChartCardsNavigator } from '../components/ChartCardsNavigator';
import { MatchResult, Employer, ChartType } from '../types';

interface DistributionPageProps {
  matchResults: MatchResult[];
  selectedJobId: number | null;
  employers: Employer[];
  selectedCandidateIds: Set<number>;
  onSetSelectedJobId: (id: number | null) => void;
  onToggleSelection: (id: number) => void;
  onProceedToDetails: () => void;
}

export const DistributionPage: React.FC<DistributionPageProps> = ({
  matchResults,
  selectedJobId,
  employers,
  selectedCandidateIds,
  onSetSelectedJobId,
  onToggleSelection,
  onProceedToDetails
}) => {
  const chartRefs = {
    salary: useRef<HTMLDivElement>(null),
    age: useRef<HTMLDivElement>(null),
    availability: useRef<HTMLDivElement>(null),
    education: useRef<HTMLDivElement>(null),
    major: useRef<HTMLDivElement>(null),
    function: useRef<HTMLDivElement>(null),
    domain: useRef<HTMLDivElement>(null),
  };

  const scrollToChart = (key: ChartType) => {
    chartRefs[key].current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const selectedCount = selectedCandidateIds.size;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-500">
        {/* Dashboard Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
            <h1 className="text-3xl font-bold text-blue-700 mb-6">Candidate Distribution</h1>
            
            <div className="flex flex-col gap-4">
                <div className="w-full md:w-1/2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Select Job Role</label>
                <div className="relative">
                    <select 
                        className="w-full p-3 pl-4 pr-10 bg-white border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none text-slate-900 text-sm transition-shadow cursor-pointer hover:border-slate-400 truncate"
                        value={selectedJobId || ''}
                        onChange={(e) => onSetSelectedJobId(Number(e.target.value))}
                    >
                        {employers.map(e => (
                            <option key={e.job_id} value={e.job_id}>{e.job_title} - {e.employer_name}</option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ArrowLeft className="rotate-[225deg] w-4 h-4" />
                    </div>
                </div>
                </div>
            </div>
        </div>

        <InstructionBanner viewMode="distribution" />

        <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Distribution Charts</h3>
            <ChartCardsNavigator onScrollTo={scrollToChart} />
        </div>

        <div className="space-y-8 pb-20">
            <div ref={chartRefs.salary}>
                <Histogram
                title="Expected Salary Distribution"
                data={matchResults}
                colorTheme="green"
                bucketType="range"
                selectedIds={selectedCandidateIds}
                onToggleSelect={onToggleSelection}
                rangeBuckets={[
                    { label: '0-2k', min: 0, max: 2000 },
                    { label: '2-4k', min: 2000, max: 4000 },
                    { label: '4-6k', min: 4000, max: 6000 },
                    { label: '6-8k', min: 6000, max: 8000 },
                    { label: '8-10k', min: 8000, max: 10000 },
                    { label: '10-12k', min: 10000, max: 12000 },
                    { label: '12-15k', min: 12000, max: 15000 },
                    { label: '15-20k', min: 15000, max: 20000 },
                    { label: '20-30k', min: 20000, max: 30000 },
                    { label: '30k+', min: 30000, max: Infinity },
                ]}
                getValue={(c) => c.candidate.minimum_expected_salary_monthly}
                />
            </div>
            <div ref={chartRefs.age}>
                <Histogram
                title="Age Distribution"
                data={matchResults}
                colorTheme="orange"
                bucketType="range"
                selectedIds={selectedCandidateIds}
                onToggleSelect={onToggleSelection}
                rangeBuckets={[
                    { label: '18-22', min: 18, max: 23 },
                    { label: '23-27', min: 23, max: 28 },
                    { label: '28-32', min: 28, max: 33 },
                    { label: '33-37', min: 33, max: 38 },
                    { label: '38-42', min: 38, max: 43 },
                    { label: '43-47', min: 43, max: 48 },
                    { label: '48-52', min: 48, max: 53 },
                    { label: '53-57', min: 53, max: 58 },
                    { label: '58-62', min: 58, max: 63 },
                    { label: '63+', min: 63, max: Infinity },
                ]}
                getValue={(c) => c.candidate.age}
                />
            </div>
            
            <div ref={chartRefs.availability}>
                <Histogram
                    title="Availability Distribution"
                    data={matchResults}
                    colorTheme="teal"
                    bucketType="category"
                    selectedIds={selectedCandidateIds}
                    onToggleSelect={onToggleSelection}
                    getValue={(c) => c.candidate.availability}
                    categoryParser={(val) => {
                        const v = val.toLowerCase().trim();
                        const standard = ['immediate', '1 week', '2 weeks', '1 month', '2 months', '3 months'];
                        if (standard.includes(v)) {
                        return v.charAt(0).toUpperCase() + v.slice(1);
                        }
                        return 'Other';
                    }}
                />
            </div>
            <div ref={chartRefs.education}>
                <Histogram
                    title="Education Subject 1 Distribution"
                    data={matchResults}
                    colorTheme="sky"
                    bucketType="category"
                    selectedIds={selectedCandidateIds}
                    onToggleSelect={onToggleSelection}
                    getValue={(c) => c.candidate.past_current_education_subject || 'Unknown'}
                />
            </div>

            <div ref={chartRefs.major}>
                <Histogram
                title="University Major Distribution"
                data={matchResults}
                colorTheme="cyan"
                bucketType="category"
                selectedIds={selectedCandidateIds}
                onToggleSelect={onToggleSelection}
                getValue={(c) => c.candidate.past_current_university_major || 'Unknown'}
                />
            </div>
            <div ref={chartRefs.function}>
                <Histogram
                title="Past Functional Skills 1 Distribution"
                data={matchResults}
                colorTheme="rose"
                bucketType="category"
                selectedIds={selectedCandidateIds}
                onToggleSelect={onToggleSelection}
                getValue={(c) => c.candidate.past_current_function || 'Unknown'}
                />
            </div>
            <div ref={chartRefs.domain}>
                <Histogram
                title="Past Domain Experience Knowledge Skills 1"
                data={matchResults}
                colorTheme="amber"
                bucketType="category"
                selectedIds={selectedCandidateIds}
                onToggleSelect={onToggleSelection}
                getValue={(c) => c.candidate.past_current_domain || 'Unknown'}
                categoryParser={(val) => {
                    const target = "STEM (SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS)";
                    if (val.trim().toUpperCase().startsWith(target)) {
                    return target;
                    }
                    return val.split(',')[0].trim() || 'Unknown';
                }}
                />
            </div>
            
            {selectedCount > 0 && (
            <div className="mt-12 bg-white border border-slate-200 rounded-xl p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">
                        {selectedCount} Candidate{selectedCount !== 1 ? 's' : ''} Selected
                    </h2>
                    <p className="text-slate-500 text-lg">
                        Click the button below to view detailed information for all selected candidates
                    </p>
                </div>
                <Button 
                    size="lg" 
                    onClick={onProceedToDetails}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-bold rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-3 shrink-0"
                >
                    <Eye className="w-6 h-6" />
                    Proceed to indicate fit
                </Button>
            </div>
            )}

        </div>
    </div>
  );
};