import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Brain, Briefcase, User, Check, Bookmark, X, ArrowLeft, Info, Calendar, DollarSign, Clock, BookOpen, GraduationCap, Zap, Network, Eye, LogOut, Activity, CheckSquare, Square, ShoppingCart, ChevronDown, PlusCircle, Search, Filter } from 'lucide-react';
import { Candidate, Employer, MatchResult, MatchResultRow } from './types';
import { processCandidates } from './utils/scoring';
import { Button, Card, Badge } from './components/UI';
import { Histogram } from './components/Charts';
import { candidatesService } from './services/candidatesService';
import { employersService } from './services/employersService';
import { matchResultsService } from './services/matchResultsService';
import { candidateEvaluationService } from './services/candidateEvaluationService';

function App() {
  // State
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);

  // Selection
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'distribution' | 'details' | 'shortlist'>('distribution');
  
  // checkoutIds is used for the "Shortlist" (Bookmarked items)
  const [checkoutIds, setCheckoutIds] = useState<Set<number>>(new Set());
  // paymentIds is used for the "Final Selection" for checkout
  const [paymentIds, setPaymentIds] = useState<Set<number>>(new Set());
  // candidateRatings tracks the employer's rating for each candidate
  const [candidateRatings, setCandidateRatings] = useState<Record<number, string>>({});
  const [shortlistFilterRatings, setShortlistFilterRatings] = useState<Set<string>>(new Set(['Top Fit', 'Maybe', 'Not a Fit', 'Unrated']));
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingMatches, setIsProcessingMatches] = useState(false);
  const [candidatesUploaded, setCandidatesUploaded] = useState(false);
  const [employersUploaded, setEmployersUploaded] = useState(false);

  // Computed
  const currentJob = employers.find(e => e.job_id === selectedJobId);
  const selectedCount = selectedCandidateIds.size;
  const selectedMatches = matchResults.filter(r => selectedCandidateIds.has(r.candidate.candidate_id));
  const shortlistedMatches = matchResults.filter(r => checkoutIds.has(r.candidate.candidate_id));

  // Refs for chart navigation
  const chartsRef = useRef<HTMLDivElement>(null);
  const chartRefs = {
    salary: useRef<HTMLDivElement>(null),
    age: useRef<HTMLDivElement>(null),
    avail: useRef<HTMLDivElement>(null),
    edu: useRef<HTMLDivElement>(null),
    major: useRef<HTMLDivElement>(null),
    func: useRef<HTMLDivElement>(null),
    domain: useRef<HTMLDivElement>(null),
  };

  // Load from Supabase on Mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [cands, emps] = await Promise.all([
          candidatesService.getCandidates(),
          employersService.getEmployers(),
        ]);
        setCandidates(cands);
        
        setEmployers(emps);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Process Matches when job or candidates change, and save results
  useEffect(() => {
    const processAndSaveMatches = async () => {
      if (currentJob && candidates.length > 0) {
        setIsProcessingMatches(true);
        try {
          // First, try to load existing results from database
          const savedResults: MatchResultRow[] = await matchResultsService.getMatchResultsByJobId(currentJob.job_id);

          if (savedResults.length > 0 && savedResults.length === candidates.length) {
            // Use saved results if available and count matches
            const enrichedResults = await Promise.all(savedResults.map(async (saved) => {
              const candidate = candidates.find(c => c.candidate_id === saved.candidate_id);
              if (!candidate) return null;

              // Fetch details for this result
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

            setMatchResults(enrichedResults.filter((r): r is MatchResult => r !== null));
          } else {
            // Calculate fresh results if no saved data or candidate count mismatch
            const results = processCandidates(candidates, currentJob);
            setMatchResults(results);

            // Save results to Supabase
            await matchResultsService.saveMatchResults(currentJob.job_id, results);
          }

          // Reset selections on new job
          setSelectedCandidateIds(new Set());
          setCheckoutIds(new Set());
          setPaymentIds(new Set());
          setCandidateRatings({});
          setShortlistFilterRatings(new Set(['Top Fit', 'Maybe', 'Not a Fit', 'Unrated']));

          // Load evaluations from database
          const evaluations = await candidateEvaluationService.getEvaluationsByJobId(currentJob.job_id);
          const ratings: Record<number, string> = {};
          const shortlisted = new Set<number>();

          Object.entries(evaluations).forEach(([candidateId, evaluation]) => {
            const cid = parseInt(candidateId);
            if (evaluation.rating) {
              ratings[cid] = evaluation.rating;
            }
            if (evaluation.isShortlisted) {
              shortlisted.add(cid);
            }
          });

          // setCandidateRatings(ratings);
          // setCheckoutIds(shortlisted);
        } catch (error) {
          console.error('Error processing match results:', error);
          // Fallback to calculating fresh results on error
          const results = processCandidates(candidates, currentJob);
          setMatchResults(results);
        } finally {
          setIsProcessingMatches(false);
        }
      }
    };
    processAndSaveMatches();
  }, [currentJob, candidates]);

  // Scroll to top when view mode changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [viewMode]);

  // Handler: Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'candidates' | 'employers') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        setIsSaving(true);

        if (type === 'candidates') {
          if (!Array.isArray(json)) throw new Error("Candidates must be an array");
          setCandidates(json);
          setCandidatesUploaded(true);
          await candidatesService.saveCandidates(json);
        } else {
          if (!Array.isArray(json)) throw new Error("Employers must be an array");
          setEmployers(json);
          setEmployersUploaded(true);
          await employersService.saveEmployers(json);
        }
        setIsSaving(false);
      } catch (err) {
        setIsSaving(false);
        alert("Invalid JSON file format");
      }
    };
    reader.readAsText(file);
  };

  // Handler: Toggle Selection from Charts
  const toggleSelection = (id: number) => {
    const newSet = new Set(selectedCandidateIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedCandidateIds(newSet);
  };

  // Handler: Remove from view (X button) - Removes from all lists
  const handleRemoveFromView = (id: number) => {
      // 1. Remove from selected (charts distribution selection)
      if (selectedCandidateIds.has(id)) {
          const newSet = new Set(selectedCandidateIds);
          newSet.delete(id);
          setSelectedCandidateIds(newSet);
      }

      // 2. Remove from shortlist (bookmark)
      if (checkoutIds.has(id)) {
          const newSet = new Set(checkoutIds);
          newSet.delete(id);
          setCheckoutIds(newSet);
      }

      // 3. Remove from payment (checkout)
      if (paymentIds.has(id)) {
          const newSet = new Set(paymentIds);
          newSet.delete(id);
          setPaymentIds(newSet);
      }

      // 4. Reset rating (if candidate was rated)
      if (candidateRatings[id]) {
          const newRatings = { ...candidateRatings };
          delete newRatings[id];
          setCandidateRatings(newRatings);
      }
  };

  // Handler: Batch Add Selection
  const handleBatchSelect = (ids: number[]) => {
    const newSet = new Set(selectedCandidateIds);
    ids.forEach(id => newSet.add(id));
    setSelectedCandidateIds(newSet);
  };

  // Handler: Toggle Shortlist (Bookmark)
  const toggleShortlist = (id: number) => {
      const next = new Set(checkoutIds);
      const isShortlisted = !next.has(id);

      if (next.has(id)) {
          next.delete(id);
          // Also remove from payment if removed from shortlist
          if (paymentIds.has(id)) {
              const nextPayment = new Set(paymentIds);
              nextPayment.delete(id);
              setPaymentIds(nextPayment);
          }
      } else {
          next.add(id);
      }
      setCheckoutIds(next);

      // Save to database
      if (currentJob) {
          const rating = candidateRatings[id] || null;
          candidateEvaluationService.saveEvaluation(currentJob.job_id, id, rating, isShortlisted);
      }
  };

  // Handler: Toggle Payment Selection
  const togglePayment = (id: number) => {
      const next = new Set(paymentIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setPaymentIds(next);
  };

  // Handler: Update Candidate Rating
  const updateCandidateRating = (candidateId: number, rating: string) => {
      setCandidateRatings(prev => ({...prev, [candidateId]: rating}));

      // Save to database
      if (currentJob) {
          const isShortlisted = checkoutIds.has(candidateId);
          candidateEvaluationService.saveEvaluation(currentJob.job_id, candidateId, rating, isShortlisted);
      }
  };

  // Scroll to Chart
  const scrollToChart = (key: keyof typeof chartRefs) => {
    chartRefs[key].current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Helper to get unselected suggestions
  const getUnselectedSuggestions = () => {
      const unselected = matchResults.filter(r => !selectedCandidateIds.has(r.candidate.candidate_id));

      const domainMap = new Map<string, { ids: number[], names: string[], scores: number[] }>();
      const functionMap = new Map<string, { ids: number[], names: string[], scores: number[] }>();

      unselected.forEach(r => {
          const name = `${r.candidate.first_name} ${r.candidate.last_name}`;
          const score = r.score;

          // Helper to add to map
          const addToMap = (map: Map<string, { ids: number[], names: string[], scores: number[] }>, key: string) => {
              if (!map.has(key)) map.set(key, { ids: [], names: [], scores: [] });
              const entry = map.get(key)!;
              entry.ids.push(r.candidate.candidate_id);
              entry.names.push(name);
              entry.scores.push(score);
          };

          // Domain
          const d = (r.candidate.past_current_domain || 'Unknown').split(',')[0].trim();
          if (d && d !== 'Unknown') addToMap(domainMap, d);

          // Function
          const f = (r.candidate.past_current_function || 'Unknown').split(',')[0].trim();
          if (f && f !== 'Unknown') addToMap(functionMap, f);
      });

      // Helper sort
      const sortMap = (map: Map<string, { ids: number[], names: string[], scores: number[] }>) => {
          return Array.from(map.entries())
            .filter(([k, v]) => v.ids.length > 0)
            .sort((a, b) => {
                // Sort by count first, then by average score
                if (b[1].ids.length !== a[1].ids.length) {
                    return b[1].ids.length - a[1].ids.length;
                }
                const avgA = a[1].scores.reduce((sum, s) => sum + s, 0) / a[1].scores.length;
                const avgB = b[1].scores.reduce((sum, s) => sum + s, 0) / b[1].scores.length;
                return avgB - avgA;
            })
            .slice(0, 5); // Take top 5
      };

      return {
          domains: sortMap(domainMap),
          functions: sortMap(functionMap),
      };
  };

  const suggestions = useMemo(() => getUnselectedSuggestions(), [matchResults, selectedCandidateIds]);


  // --- Views ---

  const UploadView = () => (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in duration-500">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Deep HR Match Configuration</h1>
        <p className="text-slate-600">Upload your data to begin the AI-powered matching process.</p>
        {isLoading && <p className="text-slate-500 text-sm mt-4">Loading data...</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Candidates Upload */}
        <Card className="p-8 border-t-4 border-t-blue-500 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Candidates Data</h2>
              <p className="text-sm text-slate-500">JSON Format</p>
            </div>
          </div>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50 transition-colors hover:bg-slate-50">
            <input
              type="file"
              accept=".json"
              onChange={(e) => handleFileUpload(e, 'candidates')}
              className="hidden"
              id="cand-upload"
            />
            <label htmlFor="cand-upload" className="cursor-pointer block w-full h-full">
              <Button variant="secondary" className="pointer-events-none mb-2">Select File</Button>
              <p className="text-sm text-slate-400">or drag and drop</p>
            </label>
            <div className="mt-4 min-h-[24px]">
              {isSaving && <span className="text-blue-600 font-semibold text-sm">Saving...</span>}
              {!isSaving && candidatesUploaded && candidates.length > 0 ? (
                <span className="text-green-600 font-semibold flex items-center justify-center gap-2 bg-green-50 py-1 px-3 rounded-full text-sm inline-block">
                  <Check size={14} /> {candidates.length} Candidates Loaded
                </span>
              ) : !isSaving && <span className="text-slate-400 text-sm">No file chosen</span>}
            </div>
          </div>
        </Card>

        {/* Employers Upload */}
        <Card className="p-8 border-t-4 border-t-green-500 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-100 rounded-lg text-green-600">
              <Briefcase size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Employers Data</h2>
              <p className="text-sm text-slate-500">JSON Format</p>
            </div>
          </div>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50 transition-colors hover:bg-slate-50">
            <input
              type="file"
              accept=".json"
              onChange={(e) => handleFileUpload(e, 'employers')}
              className="hidden"
              id="emp-upload"
            />
            <label htmlFor="emp-upload" className="cursor-pointer block w-full h-full">
              <Button variant="secondary" className="pointer-events-none mb-2">Select File</Button>
              <p className="text-sm text-slate-400">or drag and drop</p>
            </label>
            <div className="mt-4 min-h-[24px]">
              {isSaving && <span className="text-blue-600 font-semibold text-sm">Saving...</span>}
              {!isSaving && employersUploaded && employers.length > 0 ? (
                <span className="text-green-600 font-semibold flex items-center justify-center gap-2 bg-green-50 py-1 px-3 rounded-full text-sm inline-block">
                  <Check size={14} /> {employers.length} Jobs Loaded
                </span>
              ) : !isSaving && <span className="text-slate-400 text-sm">No file chosen</span>}
            </div>
          </div>
        </Card>
      </div>

      {/* Button conditionally rendered based on upload flags AND array length */}
      {candidatesUploaded && candidates.length > 0 && employersUploaded && employers.length > 0 && (
        <div className="mt-16 flex justify-center animate-in fade-in slide-in-from-bottom-4">
          <button
             onClick={() => setSelectedJobId(employers[0].job_id)}
             className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-blue-600 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 hover:bg-blue-700 hover:scale-105 hover:shadow-xl"
          >
             Proceed to Dashboard
             <ArrowLeft className="mr-2 w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );

  const CheckoutModal = () => {
    if (!isCheckoutOpen) return null;
    // Use paymentIds for final checkout
    const items = matchResults.filter(r => paymentIds.has(r.candidate.candidate_id));
    const total = items.length * 10;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in p-4">
        <Card className="w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <ShoppingCart size={20} className="text-blue-600"/> Checkout
            </h3>
            <button onClick={() => setIsCheckoutOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-200 rounded-full">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            <h4 className="font-semibold text-slate-700 mb-4 flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded">{items.length} items</span>
            </h4>
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.candidate.candidate_id} className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 flex items-center justify-center text-xs font-bold shadow-sm">
                        {item.candidate.first_name[0]}{item.candidate.last_name[0]}
                     </div>
                     <div className="flex flex-col">
                        <span className="font-medium text-slate-800">{item.candidate.first_name} {item.candidate.last_name}</span>
                        <span className="text-xs text-slate-500">{item.candidate.current_city}</span>
                     </div>
                  </div>
                  <span className="font-semibold text-slate-700">S$10.00</span>
                </div>
              ))}
              {items.length === 0 && <p className="text-slate-500 italic text-center py-4">No candidates selected.</p>}
            </div>
            
            <div className="border-t border-slate-200 mt-6 pt-4 space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>S${total}.00</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-slate-900 pt-2 border-t border-slate-100 mt-2">
                <span>Total</span>
                <span>S${total}.00</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsCheckoutOpen(false)}>Cancel</Button>
            <Button onClick={() => alert("Proceeding to payment gateway...")} disabled={items.length === 0} className="px-6">
              Proceed to Payment
            </Button>
          </div>
        </Card>
      </div>
    );
  };

  const InstructionBanner = () => (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden shadow-sm">
      <div className="z-10 relative w-full">
         <h2 className="text-xl font-bold text-blue-900 flex items-center gap-3 mb-4">
           <div className="bg-blue-600 text-white p-1.5 rounded-full"><Info size={20}/></div>
           How to Use This Page
         </h2>
         <ol className="space-y-3 text-blue-900/80 text-sm">
           <li className="flex gap-2">
             <span className="font-bold text-blue-700">1.</span>
             <span><span className="font-bold text-blue-800">View the distribution charts below</span> - Each chart shows candidates grouped by different criteria (salary, age, availability, etc.)</span>
           </li>
           <li className="flex gap-2">
             <span className="font-bold text-blue-700">2.</span>
             <span><span className="font-bold text-blue-800">Click on colored dots</span> in any chart to select candidates. Selected dots will turn <span className="inline-block w-3 h-3 bg-yellow-400 rounded-full mx-1 align-middle border border-yellow-500/20"></span> yellow.</span>
           </li>
           <li className="flex gap-2">
             <span className="font-bold text-blue-700">3.</span>
             <span><span className="font-bold text-blue-800">Scroll down and click</span> the "View Selected Candidates" button to see detailed information and shortlist them.</span>
           </li>
         </ol>
      </div>
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-blue-100 rounded-full opacity-50 blur-3xl pointer-events-none"></div>
    </div>
  );

  const ChartCardsNavigator = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
      {[
        { id: 'salary', label: 'Expected Salary Distribution', icon: DollarSign, color: 'bg-green-50 border-green-200 text-green-800' },
        { id: 'age', label: 'Age Distribution', icon: Calendar, color: 'bg-orange-50 border-orange-200 text-orange-800' },
        { id: 'avail', label: 'Availability Distribution', icon: Clock, color: 'bg-teal-50 border-teal-200 text-teal-800' },
        { id: 'edu', label: 'Education Subject 1', icon: BookOpen, color: 'bg-sky-50 border-sky-200 text-sky-800' },
        { id: 'major', label: 'University Major', icon: GraduationCap, color: 'bg-cyan-50 border-cyan-200 text-cyan-800' },
        { id: 'func', label: 'Past Functional Skills 1', icon: Zap, color: 'bg-rose-50 border-rose-200 text-rose-800' },
        { id: 'domain', label: 'Past Domain Knowledge 1', icon: Network, color: 'bg-amber-50 border-amber-200 text-amber-800' },
      ].map((item) => (
        <button
          key={item.id}
          onClick={() => scrollToChart(item.id as keyof typeof chartRefs)}
          className={`${item.color} border p-4 rounded-lg flex flex-col items-center justify-center text-center gap-3 transition-all hover:scale-105 hover:shadow-md h-full min-h-[120px]`}
        >
          <item.icon size={24} className="opacity-80"/>
          <span className="text-xs font-bold leading-tight">{item.label}</span>
        </button>
      ))}
    </div>
  );

  // Helper for Elimination Criteria items
  const CriteriaItem = ({ label, value, className = '' }: { label: string, value: React.ReactNode, className?: string }) => (
     <div className={`bg-white p-3.5 rounded-lg border border-orange-100 shadow-sm flex flex-col gap-1.5 h-full ${className}`}>
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{label}</span>
        <div className="font-bold text-sm text-slate-900 break-words">
            {value ?? '-'}
        </div>
     </div>
  );

  // Helper for Questionnaire items
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

  // View state determination
  const isShortlistView = viewMode === 'shortlist';
  const isDetailsView = viewMode === 'details';
  // If in details view, show selected candidates from distribution. 
  // If in shortlist view, show candidates that are in the shortlist (checkoutIds).
  let itemsToShow = isShortlistView ? shortlistedMatches : selectedMatches;

  if (isShortlistView) {
      const isAllSelected = shortlistFilterRatings.size === 4;
      if (!isAllSelected) {
          itemsToShow = itemsToShow.filter(r => {
              const rating = candidateRatings[r.candidate.candidate_id];
              if (shortlistFilterRatings.has('Unrated') && !rating) return true;
              if (rating && shortlistFilterRatings.has(rating)) return true;
              return false;
          });
      }
  }

  // Main UI Render
  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-900">
      
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
         <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
            {/* Left: Logo */}
            <div className="flex items-center gap-3">
               <div className="bg-blue-600 p-2 rounded-lg text-white shadow-sm">
                  <Brain size={24} />
               </div>
               <span className="text-xl font-bold text-blue-700 tracking-tight">Deep HR Match</span>
            </div>

            {/* Center: Title */}
            <h1 className="hidden md:block text-2xl font-bold text-slate-900">Employer Dashboard</h1>

            {/* Right: User + Logout */}
            <div className="flex items-center gap-4">
               <div className="text-right hidden sm:block">
                  <p className="text-xs text-slate-500 font-medium">Logged in as:</p>
                  <p className="text-sm font-bold text-slate-900">Winston Tan</p>
               </div>
               <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-4 shadow-md hover:shadow-lg transition-all">
                  Logout <LogOut size={16} />
               </Button>
            </div>
         </div>
      </header>

      {/* Floating Badge - Only shows when count > 0 and in distribution view */}
      {selectedCount > 0 && viewMode === 'distribution' && (
         <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center animate-in slide-in-from-right-10">
            <div className="bg-blue-600 text-white w-20 h-20 md:w-24 md:h-24 rounded-full flex flex-col items-center justify-center shadow-xl border-4 border-white transition-transform hover:scale-110 cursor-default">
                <span className="text-3xl font-bold leading-none">{selectedCount}</span>
                <span className="text-[10px] uppercase font-bold tracking-wide">Selected</span>
            </div>
         </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {selectedJobId ? (
          <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-500">
            {isProcessingMatches ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Activity className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Loading data...</h2>
                </div>
              </div>
            ) : viewMode === 'distribution' ? (
              <>
                {/* Dashboard Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
                  <h1 className="text-3xl font-bold text-blue-700 mb-6">Candidate Distribution</h1>
                  
                  <div className="flex flex-col gap-4">
                      <Button 
                        variant="secondary" 
                        onClick={() => setSelectedJobId(null)}
                        className="self-start text-slate-600 border-slate-300 hover:bg-slate-100 pl-3"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Data
                      </Button>
                      
                      <div className="w-full md:w-1/2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Select Job Role</label>
                        <div className="relative">
                            <select 
                                className="w-full p-3 pl-4 pr-10 bg-white border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none text-slate-900 text-sm transition-shadow cursor-pointer hover:border-slate-400 truncate"
                                value={selectedJobId}
                                onChange={(e) => setSelectedJobId(Number(e.target.value))}
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

                <InstructionBanner />

                <div className="mb-4">
                   <h3 className="text-lg font-bold text-slate-900 mb-4">Distribution Charts</h3>
                   <ChartCardsNavigator />
                </div>

                <div className="space-y-8 pb-20" ref={chartsRef}>
                    <div ref={chartRefs.salary}>
                      <Histogram
                        title="Expected Salary Distribution"
                        data={matchResults}
                        colorTheme="green"
                        bucketType="range"
                        selectedIds={selectedCandidateIds}
                        onToggleSelect={toggleSelection}
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
                        onToggleSelect={toggleSelection}
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
                  
                     <div ref={chartRefs.avail}>
                        <Histogram
                            title="Availability Distribution"
                            data={matchResults}
                            colorTheme="teal"
                            bucketType="category"
                            selectedIds={selectedCandidateIds}
                            onToggleSelect={toggleSelection}
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
                     <div ref={chartRefs.edu}>
                        <Histogram
                          title="Education Subject 1 Distribution"
                          data={matchResults}
                          colorTheme="sky"
                          bucketType="category"
                          selectedIds={selectedCandidateIds}
                          onToggleSelect={toggleSelection}
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
                        onToggleSelect={toggleSelection}
                        getValue={(c) => c.candidate.past_current_university_major || 'Unknown'}
                      />
                    </div>
                    <div ref={chartRefs.func}>
                      <Histogram
                        title="Past Functional Skills 1 Distribution"
                        data={matchResults}
                        colorTheme="rose"
                        bucketType="category"
                        selectedIds={selectedCandidateIds}
                        onToggleSelect={toggleSelection}
                        getValue={(c) => c.candidate.past_current_function || 'Unknown'}
                      />
                    </div>
                    <div ref={chartRefs.domain}>
                      <Histogram
                        title="Past Domain Knowledge 1 Distribution"
                        data={matchResults}
                        colorTheme="amber"
                        bucketType="category"
                        selectedIds={selectedCandidateIds}
                        onToggleSelect={toggleSelection}
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
                            onClick={() => setViewMode('details')} 
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-bold rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-3 shrink-0"
                        >
                            <Eye className="w-6 h-6" />
                            Proceed to View Selected Candidates
                        </Button>
                    </div>
                  )}

                </div>
              </>
            ) : (
              // Details View OR Shortlist View
              <div className="max-w-7xl mx-auto px-4 py-8">
                
                {/* 1. Header Row */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                   <h2 className="text-2xl font-bold text-slate-900">
                     {isShortlistView ? 'Final Shortlist' : 'Shortlisted Candidate Details'}
                   </h2>
                   <div className="flex items-center gap-3">
                       {isShortlistView && (
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
                                               {shortlistFilterRatings.size < 4 && (
                                                   <button
                                                       onClick={() => setShortlistFilterRatings(new Set(['Top Fit', 'Maybe', 'Not a Fit', 'Unrated']))}
                                                       className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                                                   >
                                                       Reset
                                                   </button>
                                               )}
                                           </div>

                                           {['Top Fit', 'Maybe', 'Not a Fit', 'Unrated'].map((rating) => {
                                               const isChecked = shortlistFilterRatings.has(rating);
                                               return (
                                                   <label key={rating} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded transition-colors">
                                                       <input
                                                           type="checkbox"
                                                           checked={isChecked}
                                                           onChange={(e) => {
                                                               const newSet = new Set(shortlistFilterRatings);
                                                               if (e.target.checked) {
                                                                   newSet.add(rating);
                                                               } else {
                                                                   newSet.delete(rating);
                                                               }
                                                               setShortlistFilterRatings(newSet);
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
                       {isShortlistView ? (
                         <Button variant="secondary" onClick={() => setViewMode('details')} className="bg-slate-700 text-white border-transparent hover:bg-slate-800">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Details
                         </Button>
                       ) : (
                         <Button variant="secondary" onClick={() => setViewMode('distribution')} className="bg-slate-700 text-white border-transparent hover:bg-slate-800">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Distribution
                         </Button>
                       )}
                   </div>
                </div>

                {/* 2. Blue Instruction Banner - Only on Details View */}
                {!isShortlistView && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 flex items-start gap-4">
                        <div className="bg-blue-600 text-white rounded-full p-2 mt-1 shrink-0">
                            <span className="font-bold text-xl px-2">!</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-blue-900 mb-3">Candidate Evaluation & Selection</h3>
                            <ol className="space-y-2 text-blue-900/80 text-base">
                                <li className="flex gap-2">
                                    <span className="font-bold text-blue-700">1.</span>
                                    <span><span className="font-bold">Review Profiles:</span> Analyze detailed candidate information, matching scores, and elimination criteria below.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-blue-700">2.</span>
                                    <span><span className="font-bold">Discover More:</span> Use the "Discover Similar Candidates" section to find others with similar skills or domain knowledge.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-blue-700">3.</span>
                                    <span><span className="font-bold">Rate Candidates:</span> Use the rating dropdown to classify each candidate as <span className="font-bold text-green-700">Top Fit</span>, <span className="font-bold text-orange-700">Maybe</span>, or <span className="font-bold text-red-700">Not a Fit</span> based on your evaluation.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-blue-700">4.</span>
                                    <span><span className="font-bold">Shortlist:</span> Click the <span className="font-bold">Shortlist button</span> (Bookmark icon) to add promising candidates to your final shortlist.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-blue-700">5.</span>
                                    <span><span className="font-bold">Proceed:</span> When ready, click "Proceed to Shortlist Page" at the bottom to review all shortlisted candidates and make your final selection.</span>
                                </li>
                            </ol>
                        </div>
                    </div>
                )}

                {/* 2.1 Instruction Banner - Only on Shortlist View */}
                {isShortlistView && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 flex items-start gap-4">
                        <div className="bg-blue-600 text-white rounded-full p-2 mt-1 shrink-0">
                            <span className="font-bold text-xl px-2">!</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-blue-900 mb-3">Final Selection Process</h3>
                            <ol className="space-y-2 text-blue-900/80 text-base">
                                <li className="flex gap-2">
                                    <span className="font-bold text-blue-700">1.</span>
                                    <span><span className="font-bold">Review & Filter:</span> Review all shortlisted candidates below. Use the filter dropdown in the header to view candidates by rating (<span className="font-bold text-green-700">Top Fit</span>, <span className="font-bold text-orange-700">Maybe</span>, <span className="font-bold text-red-700">Not a Fit</span>, or <span className="font-bold">Unrated</span>).</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-blue-700">2.</span>
                                    <span><span className="font-bold">Update Ratings:</span> You can still adjust candidate ratings using the dropdown on each card if needed.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-blue-700">3.</span>
                                    <span><span className="font-bold">Select for Checkout:</span> Click the <span className="font-bold">Select</span> button on candidates you want to proceed with for final checkout.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-blue-700">4.</span>
                                    <span><span className="font-bold">Complete:</span> Click "Proceed to Checkout" at the bottom to finalize your selection and complete the process.</span>
                                </li>
                            </ol>
                        </div>
                    </div>
                )}

                {/* 2.5 New: Discover Similar Candidates - Only on Details View */}
                {!isShortlistView && (suggestions.domains.length > 0 || suggestions.functions.length > 0) && (
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
                                                        onClick={() => handleBatchSelect(data.ids)}
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
                                                        onClick={() => handleBatchSelect(data.ids)}
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
              
                {/* 3. Stats Cards (Green, Orange, Pink) - Show ONLY in Details View */}
                {!isShortlistView && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  {/* Green */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 shadow-sm">
                     <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">NUMBER OF CANDIDATES</h4>
                     <p className="text-4xl font-bold text-emerald-800">{itemsToShow.length}</p>
                  </div>
                  {/* Orange */}
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 shadow-sm">
                     <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">LOWEST MATCH SCORE</h4>
                     <p className="text-4xl font-bold text-orange-700">
                         {itemsToShow.length > 0 ? Math.min(...itemsToShow.map(m => m.score)) : 0}
                     </p>
                  </div>
                  {/* Pink */}
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 shadow-sm">
                     <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">HIGHEST MATCH SCORE</h4>
                     <p className="text-4xl font-bold text-rose-700">
                         {itemsToShow.length > 0 ? Math.max(...itemsToShow.map(m => m.score)) : 0}
                     </p>
                  </div>
                </div>
                )}

                {/* 4. Unified Candidates Card */}
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
                                {isShortlistView && shortlistFilterRatings.size < 4
                                    ? "No candidates match the selected filter criteria."
                                    : "There are no candidates to display in this view."}
                            </p>
                            <div className="flex gap-4">
                                {isShortlistView && shortlistFilterRatings.size < 4 ? (
                                    <Button variant="secondary" onClick={() => setShortlistFilterRatings(new Set(['Top Fit', 'Maybe', 'Not a Fit', 'Unrated']))}>
                                        Clear Filters
                                    </Button>
                                ) : (
                                    <Button variant="secondary" onClick={() => setViewMode('distribution')}>
                                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                                    </Button>
                                )}

                                {/* Show Proceed button here if we have items in the background */}
                                {!isShortlistView && checkoutIds.size > 0 && (
                                    <Button onClick={() => setViewMode('shortlist')}>
                                        Proceed to Shortlist Page ({checkoutIds.size})
                                    </Button>
                                )}
                            </div>
                        </div>
                      </div>
                    </Card>
                  ) : isShortlistView ? (
                    // Shortlist View: Group by Rating
                    <div className="space-y-8">
                      {/* Top Fit Section */}
                      {(() => {
                        const topFitCandidates = itemsToShow.filter(r => candidateRatings[r.candidate.candidate_id] === 'Top Fit');
                        return topFitCandidates.length > 0 && (
                          <Card className="overflow-hidden border-2 border-green-300 shadow-md bg-green-50/30">
                            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Check className="w-6 h-6" />
                                <h3 className="text-xl font-bold">Top Fit</h3>
                              </div>
                              <Badge color="green" className="bg-green-500 text-white px-3 py-1 text-sm font-bold">
                                {topFitCandidates.length} candidate{topFitCandidates.length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                            <div className="p-6 space-y-12">
                              {topFitCandidates.map((res, index) => {
                                const isBookmarked = checkoutIds.has(res.candidate.candidate_id);
                                const isPaymentSelected = paymentIds.has(res.candidate.candidate_id);
                                const rating = candidateRatings[res.candidate.candidate_id] || '';
                                const q = res.candidate.questionnaire;

                                return (
                                    <div key={res.candidate.candidate_id} className={index > 0 ? "pt-12 border-t border-green-200" : ""}>
                                        
                                        {/* Candidate Header Row */}
                                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                                            <div className="flex items-center gap-4">
                                                {/* Avatar */}
                                                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-medium shadow-sm overflow-hidden">
                                                    {/* Try to use profile picture if valid string, else fallback */}
                                                    {res.candidate.profile_picture_url && res.candidate.profile_picture_url.length > 5 ? (
                                                    <img src={res.candidate.profile_picture_url} alt="Profile" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                                                    ) : null}
                                                    <span className={res.candidate.profile_picture_url && res.candidate.profile_picture_url.length > 5 ? 'hidden' : ''}>
                                                        {res.candidate.first_name[0]}{res.candidate.last_name[0]}
                                                    </span>
                                                </div>
                                                
                                                <div>
                                                    <h3 className="text-2xl font-bold text-slate-900 leading-none mb-2">
                                                        {res.candidate.first_name} {res.candidate.last_name}
                                                    </h3>
                                                    <div className="flex items-center gap-3">
                                                        {/* Rank */}
                                                        <div className="flex items-center gap-1 text-slate-600 font-medium">
                                                            Rank: 
                                                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                                                                {res.rank}
                                                            </span>
                                                        </div>
                                                        <div className="h-4 w-px bg-slate-300 mx-1"></div>
                                                        {/* Match Score */}
                                                        <div className="flex items-center gap-1 text-slate-600 font-medium">
                                                            Match Score:
                                                            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-sm font-bold">
                                                                {res.score}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions Right */}
                                            <div className="flex items-center gap-3 self-end lg:self-auto">
                                                {/* NEW RATING DROPDOWN */}
                                                <div className="relative">
                                                    <select
                                                        value={rating}
                                                        onChange={(e) => updateCandidateRating(res.candidate.candidate_id, e.target.value)}
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
                                                    onClick={() => toggleShortlist(res.candidate.candidate_id)}
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
                                                        onClick={() => togglePayment(res.candidate.candidate_id)}
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
                                                        onClick={() => handleRemoveFromView(res.candidate.candidate_id)}
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
                                                {res.details.breakdown.filter(b => b.pastCurrentMatches.length > 0).map((item, idx) => (
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
                                                {res.details.breakdown.every(b => b.pastCurrentMatches.length === 0) && (
                                                    <p className="text-sm text-slate-500 italic">No past & current matches.</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                            {/* ORANGE SECTION: Elimination Criteria */}
                                            <div className="bg-orange-50 rounded-lg border border-orange-100 p-5 h-full">
                                                <h4 className="text-lg font-bold text-slate-900 mb-4">Elimination Criteria - basic information</h4>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {/* Row 1 */}
                                                    <CriteriaItem label="Age" value={res.candidate.age} />
                                                    <CriteriaItem label="Gender" value={res.candidate.gender} />
                                                    <CriteriaItem label="DOB" value={res.candidate.date_of_birth} />
                                                    
                                                    {/* Row 2 */}
                                                    <CriteriaItem label="Nationality" value={res.candidate.nationality} />
                                                    <CriteriaItem label="Birth Country" value={res.candidate.country_of_birth} />
                                                    
                                                    {/* Row 3 */}
                                                    <CriteriaItem label="Current Country" value={res.candidate.current_country} />
                                                    <CriteriaItem label="Min Salary" value={`$${res.candidate.minimum_expected_salary_monthly.toLocaleString()}`} />
                                                    <CriteriaItem label="Availability" value={res.candidate.availability} />
                                                    <CriteriaItem label="Visa Status" value={res.candidate.visa_status} />

                                                    {/* Row 4: New Profile Data */}
                                                    {res.candidate.fitness_level && <CriteriaItem label="Fitness" value={res.candidate.fitness_level} />}
                                                    {res.candidate.height_cm && <CriteriaItem label="Height" value={`${res.candidate.height_cm} cm`} />}
                                                    {res.candidate.weight_kg && <CriteriaItem label="Weight" value={`${res.candidate.weight_kg} kg`} />}
                                                    
                                                    <CriteriaItem label="Email" value={res.candidate.email} className="md:col-span-2 break-all" />
                                                    <CriteriaItem label="Phone" value={res.candidate.phone} className="md:col-span-2" />
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
                              })}
                            </div>
                          </Card>
                        );
                      })()}

                      {/* Maybe Section */}
                      {(() => {
                        const maybeCandidates = itemsToShow.filter(r => candidateRatings[r.candidate.candidate_id] === 'Maybe');
                        return maybeCandidates.length > 0 && (
                          <Card className="overflow-hidden border-2 border-orange-300 shadow-md bg-orange-50/30">
                            <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Info className="w-6 h-6" />
                                <h3 className="text-xl font-bold">Maybe</h3>
                              </div>
                              <Badge color="orange" className="bg-orange-500 text-white px-3 py-1 text-sm font-bold">
                                {maybeCandidates.length} candidate{maybeCandidates.length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                            <div className="p-6 space-y-12">
                              {maybeCandidates.map((res, index) => {
                                const isBookmarked = checkoutIds.has(res.candidate.candidate_id);
                                const isPaymentSelected = paymentIds.has(res.candidate.candidate_id);
                                const rating = candidateRatings[res.candidate.candidate_id] || '';
                                const q = res.candidate.questionnaire;

                                return (
                                    <div key={res.candidate.candidate_id} className={index > 0 ? "pt-12 border-t border-orange-200" : ""}>

                                        {/* Candidate Header Row */}
                                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                                            <div className="flex items-center gap-4">
                                                {/* Avatar */}
                                                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-medium shadow-sm overflow-hidden">
                                                    {/* Try to use profile picture if valid string, else fallback */}
                                                    {res.candidate.profile_picture_url && res.candidate.profile_picture_url.length > 5 ? (
                                                    <img src={res.candidate.profile_picture_url} alt="Profile" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                                                    ) : null}
                                                    <span className={res.candidate.profile_picture_url && res.candidate.profile_picture_url.length > 5 ? 'hidden' : ''}>
                                                        {res.candidate.first_name[0]}{res.candidate.last_name[0]}
                                                    </span>
                                                </div>

                                                <div>
                                                    <h3 className="text-2xl font-bold text-slate-900 leading-none mb-2">
                                                        {res.candidate.first_name} {res.candidate.last_name}
                                                    </h3>
                                                    <div className="flex items-center gap-3">
                                                        {/* Rank */}
                                                        <div className="flex items-center gap-1 text-slate-600 font-medium">
                                                            Rank:
                                                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                                                                {res.rank}
                                                            </span>
                                                        </div>
                                                        <div className="h-4 w-px bg-slate-300 mx-1"></div>
                                                        {/* Match Score */}
                                                        <div className="flex items-center gap-1 text-slate-600 font-medium">
                                                            Match Score:
                                                            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-sm font-bold">
                                                                {res.score}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions Right */}
                                            <div className="flex items-center gap-3 self-end lg:self-auto">
                                                {/* NEW RATING DROPDOWN */}
                                                <div className="relative">
                                                    <select
                                                        value={rating}
                                                        onChange={(e) => updateCandidateRating(res.candidate.candidate_id, e.target.value)}
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
                                                    onClick={() => toggleShortlist(res.candidate.candidate_id)}
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
                                                <button
                                                    onClick={() => togglePayment(res.candidate.candidate_id)}
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
                                                {res.details.breakdown.filter(b => b.pastCurrentMatches.length > 0).map((item, idx) => (
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
                                                {res.details.breakdown.every(b => b.pastCurrentMatches.length === 0) && (
                                                    <p className="text-sm text-slate-500 italic">No past & current matches.</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                            {/* ORANGE SECTION: Elimination Criteria */}
                                            <div className="bg-orange-50 rounded-lg border border-orange-100 p-5 h-full">
                                                <h4 className="text-lg font-bold text-slate-900 mb-4">Elimination Criteria - basic information</h4>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {/* Row 1 */}
                                                    <CriteriaItem label="Age" value={res.candidate.age} />
                                                    <CriteriaItem label="Gender" value={res.candidate.gender} />
                                                    <CriteriaItem label="DOB" value={res.candidate.date_of_birth} />

                                                    {/* Row 2 */}
                                                    <CriteriaItem label="Nationality" value={res.candidate.nationality} />
                                                    <CriteriaItem label="Birth Country" value={res.candidate.country_of_birth} />

                                                    {/* Row 3 */}
                                                    <CriteriaItem label="Current Country" value={res.candidate.current_country} />
                                                    <CriteriaItem label="Min Salary" value={`$${res.candidate.minimum_expected_salary_monthly.toLocaleString()}`} />
                                                    <CriteriaItem label="Availability" value={res.candidate.availability} />
                                                    <CriteriaItem label="Visa Status" value={res.candidate.visa_status} />

                                                    {/* Row 4: New Profile Data */}
                                                    {res.candidate.fitness_level && <CriteriaItem label="Fitness" value={res.candidate.fitness_level} />}
                                                    {res.candidate.height_cm && <CriteriaItem label="Height" value={`${res.candidate.height_cm} cm`} />}
                                                    {res.candidate.weight_kg && <CriteriaItem label="Weight" value={`${res.candidate.weight_kg} kg`} />}

                                                    <CriteriaItem label="Email" value={res.candidate.email} className="md:col-span-2 break-all" />
                                                    <CriteriaItem label="Phone" value={res.candidate.phone} className="md:col-span-2" />
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
                              })}
                            </div>
                          </Card>
                        );
                      })()}

                      {/* Not a Fit Section */}
                      {(() => {
                        const notFitCandidates = itemsToShow.filter(r => candidateRatings[r.candidate.candidate_id] === 'Not a Fit');
                        return notFitCandidates.length > 0 && (
                          <Card className="overflow-hidden border-2 border-red-300 shadow-md bg-red-50/30">
                            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <X className="w-6 h-6" />
                                <h3 className="text-xl font-bold">Not a Fit</h3>
                              </div>
                              <Badge color="rose" className="bg-red-500 text-white px-3 py-1 text-sm font-bold">
                                {notFitCandidates.length} candidate{notFitCandidates.length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                            <div className="p-6 space-y-12">
                              {notFitCandidates.map((res, index) => {
                                const isBookmarked = checkoutIds.has(res.candidate.candidate_id);
                                const isPaymentSelected = paymentIds.has(res.candidate.candidate_id);
                                const rating = candidateRatings[res.candidate.candidate_id] || '';
                                const q = res.candidate.questionnaire;

                                return (
                                    <div key={res.candidate.candidate_id} className={index > 0 ? "pt-12 border-t border-red-200" : ""}>

                                        {/* Candidate Header Row */}
                                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                                            <div className="flex items-center gap-4">
                                                {/* Avatar */}
                                                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-medium shadow-sm overflow-hidden">
                                                    {/* Try to use profile picture if valid string, else fallback */}
                                                    {res.candidate.profile_picture_url && res.candidate.profile_picture_url.length > 5 ? (
                                                    <img src={res.candidate.profile_picture_url} alt="Profile" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                                                    ) : null}
                                                    <span className={res.candidate.profile_picture_url && res.candidate.profile_picture_url.length > 5 ? 'hidden' : ''}>
                                                        {res.candidate.first_name[0]}{res.candidate.last_name[0]}
                                                    </span>
                                                </div>

                                                <div>
                                                    <h3 className="text-2xl font-bold text-slate-900 leading-none mb-2">
                                                        {res.candidate.first_name} {res.candidate.last_name}
                                                    </h3>
                                                    <div className="flex items-center gap-3">
                                                        {/* Rank */}
                                                        <div className="flex items-center gap-1 text-slate-600 font-medium">
                                                            Rank:
                                                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                                                                {res.rank}
                                                            </span>
                                                        </div>
                                                        <div className="h-4 w-px bg-slate-300 mx-1"></div>
                                                        {/* Match Score */}
                                                        <div className="flex items-center gap-1 text-slate-600 font-medium">
                                                            Match Score:
                                                            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-sm font-bold">
                                                                {res.score}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions Right */}
                                            <div className="flex items-center gap-3 self-end lg:self-auto">
                                                {/* NEW RATING DROPDOWN */}
                                                <div className="relative">
                                                    <select
                                                        value={rating}
                                                        onChange={(e) => updateCandidateRating(res.candidate.candidate_id, e.target.value)}
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
                                                    onClick={() => toggleShortlist(res.candidate.candidate_id)}
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
                                                <button
                                                    onClick={() => togglePayment(res.candidate.candidate_id)}
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
                                                {res.details.breakdown.filter(b => b.pastCurrentMatches.length > 0).map((item, idx) => (
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
                                                {res.details.breakdown.every(b => b.pastCurrentMatches.length === 0) && (
                                                    <p className="text-sm text-slate-500 italic">No past & current matches.</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                            {/* ORANGE SECTION: Elimination Criteria */}
                                            <div className="bg-orange-50 rounded-lg border border-orange-100 p-5 h-full">
                                                <h4 className="text-lg font-bold text-slate-900 mb-4">Elimination Criteria - basic information</h4>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {/* Row 1 */}
                                                    <CriteriaItem label="Age" value={res.candidate.age} />
                                                    <CriteriaItem label="Gender" value={res.candidate.gender} />
                                                    <CriteriaItem label="DOB" value={res.candidate.date_of_birth} />

                                                    {/* Row 2 */}
                                                    <CriteriaItem label="Nationality" value={res.candidate.nationality} />
                                                    <CriteriaItem label="Birth Country" value={res.candidate.country_of_birth} />

                                                    {/* Row 3 */}
                                                    <CriteriaItem label="Current Country" value={res.candidate.current_country} />
                                                    <CriteriaItem label="Min Salary" value={`$${res.candidate.minimum_expected_salary_monthly.toLocaleString()}`} />
                                                    <CriteriaItem label="Availability" value={res.candidate.availability} />
                                                    <CriteriaItem label="Visa Status" value={res.candidate.visa_status} />

                                                    {/* Row 4: New Profile Data */}
                                                    {res.candidate.fitness_level && <CriteriaItem label="Fitness" value={res.candidate.fitness_level} />}
                                                    {res.candidate.height_cm && <CriteriaItem label="Height" value={`${res.candidate.height_cm} cm`} />}
                                                    {res.candidate.weight_kg && <CriteriaItem label="Weight" value={`${res.candidate.weight_kg} kg`} />}

                                                    <CriteriaItem label="Email" value={res.candidate.email} className="md:col-span-2 break-all" />
                                                    <CriteriaItem label="Phone" value={res.candidate.phone} className="md:col-span-2" />
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
                              })}
                            </div>
                          </Card>
                        );
                      })()}

                      {/* Unrated Section */}
                      {(() => {
                        const unratedCandidates = itemsToShow.filter(r => !candidateRatings[r.candidate.candidate_id]);
                        return unratedCandidates.length > 0 && (
                          <Card className="overflow-hidden border-2 border-slate-300 shadow-md bg-slate-50/30">
                            <div className="bg-gradient-to-r from-slate-600 to-slate-700 text-white p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Activity className="w-6 h-6" />
                                <h3 className="text-xl font-bold">Unrated</h3>
                              </div>
                              <Badge color="slate" className="bg-slate-500 text-white px-3 py-1 text-sm font-bold">
                                {unratedCandidates.length} candidate{unratedCandidates.length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                            <div className="p-6 space-y-12">
                              {unratedCandidates.map((res, index) => {
                                const isBookmarked = checkoutIds.has(res.candidate.candidate_id);
                                const isPaymentSelected = paymentIds.has(res.candidate.candidate_id);
                                const rating = candidateRatings[res.candidate.candidate_id] || '';
                                const q = res.candidate.questionnaire;

                                return (
                                    <div key={res.candidate.candidate_id} className={index > 0 ? "pt-12 border-t border-slate-200" : ""}>

                                        {/* Candidate Header Row */}
                                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                                            <div className="flex items-center gap-4">
                                                {/* Avatar */}
                                                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-medium shadow-sm overflow-hidden">
                                                    {/* Try to use profile picture if valid string, else fallback */}
                                                    {res.candidate.profile_picture_url && res.candidate.profile_picture_url.length > 5 ? (
                                                    <img src={res.candidate.profile_picture_url} alt="Profile" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                                                    ) : null}
                                                    <span className={res.candidate.profile_picture_url && res.candidate.profile_picture_url.length > 5 ? 'hidden' : ''}>
                                                        {res.candidate.first_name[0]}{res.candidate.last_name[0]}
                                                    </span>
                                                </div>

                                                <div>
                                                    <h3 className="text-2xl font-bold text-slate-900 leading-none mb-2">
                                                        {res.candidate.first_name} {res.candidate.last_name}
                                                    </h3>
                                                    <div className="flex items-center gap-3">
                                                        {/* Rank */}
                                                        <div className="flex items-center gap-1 text-slate-600 font-medium">
                                                            Rank:
                                                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                                                                {res.rank}
                                                            </span>
                                                        </div>
                                                        <div className="h-4 w-px bg-slate-300 mx-1"></div>
                                                        {/* Match Score */}
                                                        <div className="flex items-center gap-1 text-slate-600 font-medium">
                                                            Match Score:
                                                            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-sm font-bold">
                                                                {res.score}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions Right */}
                                            <div className="flex items-center gap-3 self-end lg:self-auto">
                                                {/* NEW RATING DROPDOWN */}
                                                <div className="relative">
                                                    <select
                                                        value={rating}
                                                        onChange={(e) => updateCandidateRating(res.candidate.candidate_id, e.target.value)}
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
                                                    onClick={() => toggleShortlist(res.candidate.candidate_id)}
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
                                                <button
                                                    onClick={() => togglePayment(res.candidate.candidate_id)}
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
                                                {res.details.breakdown.filter(b => b.pastCurrentMatches.length > 0).map((item, idx) => (
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
                                                {res.details.breakdown.every(b => b.pastCurrentMatches.length === 0) && (
                                                    <p className="text-sm text-slate-500 italic">No past & current matches.</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                            {/* ORANGE SECTION: Elimination Criteria */}
                                            <div className="bg-orange-50 rounded-lg border border-orange-100 p-5 h-full">
                                                <h4 className="text-lg font-bold text-slate-900 mb-4">Elimination Criteria - basic information</h4>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {/* Row 1 */}
                                                    <CriteriaItem label="Age" value={res.candidate.age} />
                                                    <CriteriaItem label="Gender" value={res.candidate.gender} />
                                                    <CriteriaItem label="DOB" value={res.candidate.date_of_birth} />

                                                    {/* Row 2 */}
                                                    <CriteriaItem label="Nationality" value={res.candidate.nationality} />
                                                    <CriteriaItem label="Birth Country" value={res.candidate.country_of_birth} />

                                                    {/* Row 3 */}
                                                    <CriteriaItem label="Current Country" value={res.candidate.current_country} />
                                                    <CriteriaItem label="Min Salary" value={`$${res.candidate.minimum_expected_salary_monthly.toLocaleString()}`} />
                                                    <CriteriaItem label="Availability" value={res.candidate.availability} />
                                                    <CriteriaItem label="Visa Status" value={res.candidate.visa_status} />

                                                    {/* Row 4: New Profile Data */}
                                                    {res.candidate.fitness_level && <CriteriaItem label="Fitness" value={res.candidate.fitness_level} />}
                                                    {res.candidate.height_cm && <CriteriaItem label="Height" value={`${res.candidate.height_cm} cm`} />}
                                                    {res.candidate.weight_kg && <CriteriaItem label="Weight" value={`${res.candidate.weight_kg} kg`} />}

                                                    <CriteriaItem label="Email" value={res.candidate.email} className="md:col-span-2 break-all" />
                                                    <CriteriaItem label="Phone" value={res.candidate.phone} className="md:col-span-2" />
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
                              })}
                            </div>
                          </Card>
                        );
                      })()}

                      {/* Proceed to Checkout Button - Only shown in Shortlist view if payment selected */}
                      {paymentIds.size > 0 && (
                          <div className="mt-8 flex justify-end animate-in fade-in slide-in-from-bottom-2 sticky bottom-4 z-10 pointer-events-none">
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
                  ) : (
                    // Details View: Show all in single card
                    <Card className="overflow-hidden border border-slate-200 shadow-sm">
                      <div className="p-6 md:p-8">
                        <div className="space-y-12">
                            {itemsToShow.map((res, index) => {
                                const isBookmarked = checkoutIds.has(res.candidate.candidate_id);
                                const isPaymentSelected = paymentIds.has(res.candidate.candidate_id);
                                const rating = candidateRatings[res.candidate.candidate_id] || '';
                                const q = res.candidate.questionnaire;

                                return (
                                    <div key={res.candidate.candidate_id} className={index > 0 ? "pt-12 border-t border-slate-200" : ""}>

                                        {/* Candidate Header Row */}
                                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                                            <div className="flex items-center gap-4">
                                                {/* Avatar */}
                                                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-medium shadow-sm overflow-hidden">
                                                    {res.candidate.profile_picture_url && res.candidate.profile_picture_url.length > 5 ? (
                                                    <img src={res.candidate.profile_picture_url} alt="Profile" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                                                    ) : null}
                                                    <span className={res.candidate.profile_picture_url && res.candidate.profile_picture_url.length > 5 ? 'hidden' : ''}>
                                                        {res.candidate.first_name[0]}{res.candidate.last_name[0]}
                                                    </span>
                                                </div>

                                                <div>
                                                    <h3 className="text-2xl font-bold text-slate-900 leading-none mb-2">
                                                        {res.candidate.first_name} {res.candidate.last_name}
                                                    </h3>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-1 text-slate-600 font-medium">
                                                            Rank:
                                                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                                                                {res.rank}
                                                            </span>
                                                        </div>
                                                        <div className="h-4 w-px bg-slate-300 mx-1"></div>
                                                        <div className="flex items-center gap-1 text-slate-600 font-medium">
                                                            Match Score:
                                                            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-sm font-bold">
                                                                {res.score}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions Right */}
                                            <div className="flex items-center gap-3 self-end lg:self-auto">
                                                <div className="relative">
                                                    <select
                                                        value={rating}
                                                        onChange={(e) => updateCandidateRating(res.candidate.candidate_id, e.target.value)}
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

                                                <button
                                                    onClick={() => toggleShortlist(res.candidate.candidate_id)}
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

                                                <button
                                                    onClick={() => handleRemoveFromView(res.candidate.candidate_id)}
                                                    className="p-2.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors"
                                                    title="Remove from View"
                                                >
                                                    <X size={20} />
                                                </button>
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
                                                {res.details.breakdown.filter(b => b.pastCurrentMatches.length > 0).map((item, idx) => (
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
                                                {res.details.breakdown.every(b => b.pastCurrentMatches.length === 0) && (
                                                    <p className="text-sm text-slate-500 italic">No past & current matches.</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                            {/* ORANGE SECTION: Elimination Criteria */}
                                            <div className="bg-orange-50 rounded-lg border border-orange-100 p-5 h-full">
                                                <h4 className="text-lg font-bold text-slate-900 mb-4">Elimination Criteria - basic information</h4>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <CriteriaItem label="Age" value={res.candidate.age} />
                                                    <CriteriaItem label="Gender" value={res.candidate.gender} />
                                                    <CriteriaItem label="DOB" value={res.candidate.date_of_birth} />
                                                    <CriteriaItem label="Nationality" value={res.candidate.nationality} />
                                                    <CriteriaItem label="Birth Country" value={res.candidate.country_of_birth} />
                                                    <CriteriaItem label="Current Country" value={res.candidate.current_country} />
                                                    <CriteriaItem label="Min Salary" value={`$${res.candidate.minimum_expected_salary_monthly.toLocaleString()}`} />
                                                    <CriteriaItem label="Availability" value={res.candidate.availability} />
                                                    <CriteriaItem label="Visa Status" value={res.candidate.visa_status} />
                                                    {res.candidate.fitness_level && <CriteriaItem label="Fitness" value={res.candidate.fitness_level} />}
                                                    {res.candidate.height_cm && <CriteriaItem label="Height" value={`${res.candidate.height_cm} cm`} />}
                                                    {res.candidate.weight_kg && <CriteriaItem label="Weight" value={`${res.candidate.weight_kg} kg`} />}
                                                    <CriteriaItem label="Email" value={res.candidate.email} className="md:col-span-2 break-all" />
                                                    <CriteriaItem label="Phone" value={res.candidate.phone} className="md:col-span-2" />
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
                            })}
                        </div>

                        {/* Proceed to Shortlist Page Button - Details View */}
                        {itemsToShow.length > 0 && (
                          <div className="mt-8 pt-8 border-t border-slate-100 flex justify-end animate-in fade-in slide-in-from-bottom-2 sticky bottom-4 z-10 pointer-events-none">
                             <Button
                                size="lg"
                                onClick={() => setViewMode('shortlist')}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg rounded-full flex items-center gap-2 font-bold shadow-xl transition-all hover:scale-105 pointer-events-auto"
                            >
                                <Bookmark className="w-5 h-5 fill-current" />
                                Proceed to Shortlist Page ({checkoutIds.size})
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
           <UploadView />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        {/* Same Footer as before */}
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-8 mb-8">
            <div>
                <div className="flex items-center gap-2 text-white mb-4">
                    <Brain size={24} className="text-blue-500"/>
                    <span className="font-bold text-lg">Deep HR Match</span>
                </div>
                <p className="text-sm text-slate-500">Revolutionizing recruitment with AI-driven precision and deep data analytics.</p>
            </div>
            <div>
                <h4 className="text-white font-bold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-sm">
                    <li><a href="#" className="hover:text-blue-400 transition-colors">About Us</a></li>
                    <li><a href="#" className="hover:text-blue-400 transition-colors">Pricing</a></li>
                    <li><a href="#" className="hover:text-blue-400 transition-colors">Success Stories</a></li>
                </ul>
            </div>
            <div>
                <h4 className="text-white font-bold mb-4">Support</h4>
                <ul className="space-y-2 text-sm">
                    <li><a href="#" className="hover:text-blue-400 transition-colors">Help Center</a></li>
                    <li><a href="#" className="hover:text-blue-400 transition-colors">API Documentation</a></li>
                    <li><a href="#" className="hover:text-blue-400 transition-colors">System Status</a></li>
                </ul>
            </div>
            <div>
                <h4 className="text-white font-bold mb-4">Contact</h4>
                <p className="text-sm mb-2">123 Innovation Drive, Tech Park</p>
                <p className="text-sm mb-2">+65 6789 0123</p>
                <p className="text-sm">support@deephrmatch.com</p>
            </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 pt-8 border-t border-slate-800 text-center text-xs text-slate-600">
            © 2024 Deep HR Match. All rights reserved.
        </div>
      </footer>
      
      {/* Modal is updated to use paymentIds internally */}
      <CheckoutModal />
    </div>
  );
}

export default App;