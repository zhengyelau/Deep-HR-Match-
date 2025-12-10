import React, { useState, useEffect, useMemo } from 'react';
import { Brain, LogOut, Activity } from 'lucide-react';
import { Candidate, Employer, MatchResult, MatchResultRow } from './types';
import { processCandidates } from './utils/scoring';
import { Button } from './components/UI';
import { candidatesService } from './services/candidatesService';
import { employersService } from './services/employersService';
import { matchResultsService } from './services/matchResultsService';
import { candidateEvaluationService } from './services/candidateEvaluationService';

// Import Pages & Components
import { UploadPage } from './pages/UploadPage';
import { DistributionPage } from './pages/DistributionPage';
import { CandidateListPage } from './pages/CandidateListPage';
import { PurchasedCandidatesPage } from './pages/PurchasedCandidatesPage';
import { CheckoutModal } from './components/CheckoutModal';
import { ProgressBar } from './components/ProgressBar';
import { purchasedCandidatesService } from './services/purchasedCandidatesService';

// Define SuggestionData type outside component for stable inference
type SuggestionData = { ids: number[]; names: string[]; scores: number[] };

function App() {
  // Global Data State
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);

  // View State
  const [viewMode, setViewMode] = useState<'distribution' | 'rating' | 'shortlisting' | 'checkout' | 'purchased'>('distribution');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Selection & Rating State
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<number>>(new Set());
  const [checkoutIds, setCheckoutIds] = useState<Set<number>>(new Set());
  const [paymentIds, setPaymentIds] = useState<Set<number>>(new Set());
  const [candidateRatings, setCandidateRatings] = useState<Record<number, string>>({});

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingMatches, setIsProcessingMatches] = useState(false);
  const [candidatesUploaded, setCandidatesUploaded] = useState(false);
  const [employersUploaded, setEmployersUploaded] = useState(false);

  // Computed Values
  const currentJob = employers.find(e => e.job_id === selectedJobId);
  const selectedCount = selectedCandidateIds.size;

  // Computed Lists
  const selectedMatches = matchResults.filter(r => selectedCandidateIds.has(r.candidate.candidate_id));
  const ratedMatches = matchResults.filter(r => selectedCandidateIds.has(r.candidate.candidate_id));
  const allRated = selectedMatches.every(r => candidateRatings[r.candidate.candidate_id]);

  // Load Initial Data
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

  // Process Matches Logic
  useEffect(() => {
    const processAndSaveMatches = async () => {
      if (currentJob && candidates.length > 0) {
        setIsProcessingMatches(true);
        try {
          // Load or Calculate matches
          const savedResults: MatchResultRow[] = await matchResultsService.getMatchResultsByJobId(currentJob.job_id);

          if (savedResults.length > 0 && savedResults.length === candidates.length) {
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
            setMatchResults(enrichedResults.filter((r): r is MatchResult => r !== null));
          } else {
            const results = processCandidates(candidates, currentJob);
            setMatchResults(results);
            await matchResultsService.saveMatchResults(currentJob.job_id, results);
          }

          // Reset local UI state
          setSelectedCandidateIds(new Set());
          setCheckoutIds(new Set());
          setPaymentIds(new Set());
          setCandidateRatings({});

          // Load Saved Evaluations
          const evaluations = await candidateEvaluationService.getEvaluationsByJobId(currentJob.job_id);
          const ratings: Record<number, string> = {};
          const shortlisted = new Set<number>();

          Object.entries(evaluations).forEach(([candidateId, evaluation]) => {
            const cid = parseInt(candidateId);
            if (evaluation.rating) ratings[cid] = evaluation.rating;
            if (evaluation.isShortlisted) shortlisted.add(cid);
          });
          // setCandidateRatings(ratings);
          // setCheckoutIds(shortlisted);
        } catch (error) {
          console.error('Error processing match results:', error);
          const results = processCandidates(candidates, currentJob);
          setMatchResults(results);
        } finally {
          setIsProcessingMatches(false);
        }
      }
    };
    processAndSaveMatches();
  }, [currentJob, candidates]);

  // View Switch Scroll Top
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [viewMode]);

  // Handlers
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

  const toggleSelection = (id: number) => {
    const newSet = new Set(selectedCandidateIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedCandidateIds(newSet);
  };

  const handleRemoveFromView = (id: number) => {
      if (selectedCandidateIds.has(id)) {
          const newSet = new Set(selectedCandidateIds);
          newSet.delete(id);
          setSelectedCandidateIds(newSet);
      }
      if (checkoutIds.has(id)) {
          const newSet = new Set(checkoutIds);
          newSet.delete(id);
          setCheckoutIds(newSet);
      }
      if (paymentIds.has(id)) {
          const newSet = new Set(paymentIds);
          newSet.delete(id);
          setPaymentIds(newSet);
      }
      if (candidateRatings[id]) {
          const newRatings = { ...candidateRatings };
          delete newRatings[id];
          setCandidateRatings(newRatings);
      }
  };

  const handleBatchSelect = (ids: number[]) => {
    const newSet = new Set(selectedCandidateIds);
    ids.forEach(id => newSet.add(id));
    setSelectedCandidateIds(newSet);
  };

  const toggleShortlist = (id: number) => {
      const next = new Set(checkoutIds);
      const isShortlisted = !next.has(id);

      if (next.has(id)) {
          next.delete(id);
          if (paymentIds.has(id)) {
              const nextPayment = new Set(paymentIds);
              nextPayment.delete(id);
              setPaymentIds(nextPayment);
          }
      } else {
          next.add(id);
      }
      setCheckoutIds(next);
      if (currentJob) {
          const rating = candidateRatings[id] || null;
          candidateEvaluationService.saveEvaluation(currentJob.job_id, id, rating, isShortlisted);
      }
  };

  const togglePayment = (id: number) => {
      const next = new Set(paymentIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setPaymentIds(next);
  };

  const updateCandidateRating = (candidateId: number, rating: string) => {
      setCandidateRatings(prev => ({...prev, [candidateId]: rating}));
      if (currentJob) {
          const isShortlisted = checkoutIds.has(candidateId);
          candidateEvaluationService.saveEvaluation(currentJob.job_id, candidateId, rating, isShortlisted);
      }
  };

  const handleProceedToShortlisting = () => {
    setViewMode('shortlisting');
  };

  const handleProceedToCheckout = () => {
    setViewMode('checkout');
  };

  const handleCompletePurchase = async () => {
    if (!currentJob) return;

    const candidateIdsToPurchase = Array.from(paymentIds);
    const success = await purchasedCandidatesService.purchaseCandidates(currentJob.job_id, candidateIdsToPurchase);

    if (success) {
      setIsCheckoutOpen(false);
      setViewMode('purchased');
      setPaymentIds(new Set());
    }
  };

  // Suggestions Calculation
  const suggestions = useMemo(() => {
      const unselected = matchResults.filter(r => !selectedCandidateIds.has(r.candidate.candidate_id));
      const domainMap = new Map<string, SuggestionData>();
      const functionMap = new Map<string, SuggestionData>();

      const addToMap = (map: Map<string, SuggestionData>, key: string, name: string, score: number, candidateId: number) => {
          if (!map.has(key)) {
             map.set(key, { ids: [], names: [], scores: [] });
          }
          const entry = map.get(key)!;
          entry.ids.push(candidateId);
          entry.names.push(name);
          entry.scores.push(score);
      };

      unselected.forEach(r => {
          const name = `${r.candidate.first_name} ${r.candidate.last_name}`;
          const d = (r.candidate.past_current_domain || 'Unknown').split(',')[0].trim();
          if (d && d !== 'Unknown') addToMap(domainMap, d, name, r.score, r.candidate.candidate_id);

          const f = (r.candidate.past_current_function || 'Unknown').split(',')[0].trim();
          if (f && f !== 'Unknown') addToMap(functionMap, f, name, r.score, r.candidate.candidate_id);
      });

      const sortMap = (map: Map<string, SuggestionData>): [string, SuggestionData][] => {
          return Array.from(map.entries())
            .filter(([k, v]) => v.ids.length > 0)
            .sort((a, b) => b[1].ids.length - a[1].ids.length)
            .slice(0, 5);
      };

      return {
          domains: sortMap(domainMap),
          functions: sortMap(functionMap),
      };
  }, [matchResults, selectedCandidateIds]);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-900">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
         <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="bg-blue-600 p-2 rounded-lg text-white shadow-sm">
                  <Brain size={24} />
               </div>
               <span className="text-xl font-bold text-blue-700 tracking-tight">Deep HR Match</span>
            </div>
            <h1 className="hidden md:block text-2xl font-bold text-slate-900">Employer Dashboard</h1>
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

      {/* Progress Bar - Show on all pages except upload AND ensure data is not loading */}
      {selectedJobId && !isProcessingMatches && <ProgressBar currentView={viewMode} />}

      {/* Floating Selection Badge */}
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
          <>
             {isProcessingMatches ? (
               <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                 <div className="relative">
                   <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                     <Activity className="w-8 h-8 text-blue-600" />
                   </div>
                 </div>
                 <h2 className="text-2xl font-bold text-slate-900">Loading data...</h2>
               </div>
             ) : viewMode === 'distribution' ? (
                <DistributionPage
                  matchResults={matchResults}
                  selectedJobId={selectedJobId}
                  employers={employers}
                  selectedCandidateIds={selectedCandidateIds}
                  onSetSelectedJobId={setSelectedJobId}
                  onToggleSelection={toggleSelection}
                  onProceedToDetails={() => setViewMode('rating')}
                />
             ) : viewMode === 'rating' ? (
                <CandidateListPage
                   viewMode="rating"
                   matchResults={selectedMatches}
                   selectedCandidateIds={selectedCandidateIds}
                   checkoutIds={checkoutIds}
                   paymentIds={paymentIds}
                   candidateRatings={candidateRatings}
                   suggestions={suggestions}
                   allRated={allRated}
                   onSetViewMode={setViewMode}
                   onUpdateRating={updateCandidateRating}
                   onToggleShortlist={toggleShortlist}
                   onTogglePayment={togglePayment}
                   onRemoveFromView={handleRemoveFromView}
                   onBatchSelect={handleBatchSelect}
                   onProceedToNext={handleProceedToShortlisting}
                   onOpenCheckout={() => setIsCheckoutOpen(true)}
                />
             ) : viewMode === 'shortlisting' ? (
                <CandidateListPage
                   viewMode="shortlisting"
                   matchResults={selectedMatches}
                   selectedCandidateIds={selectedCandidateIds}
                   checkoutIds={checkoutIds}
                   paymentIds={paymentIds}
                   candidateRatings={candidateRatings}
                   suggestions={suggestions}
                   allRated={allRated}
                   onSetViewMode={setViewMode}
                   onUpdateRating={updateCandidateRating}
                   onToggleShortlist={toggleShortlist}
                   onTogglePayment={togglePayment}
                   onRemoveFromView={handleRemoveFromView}
                   onBatchSelect={handleBatchSelect}
                   onProceedToNext={handleProceedToCheckout}
                   onOpenCheckout={() => setIsCheckoutOpen(true)}
                />
             ) : viewMode === 'checkout' ? (
                <CandidateListPage
                   viewMode="checkout"
                   matchResults={matchResults.filter(r => checkoutIds.has(r.candidate.candidate_id))}
                   selectedCandidateIds={selectedCandidateIds}
                   checkoutIds={checkoutIds}
                   paymentIds={paymentIds}
                   candidateRatings={candidateRatings}
                   suggestions={suggestions}
                   allRated={allRated}
                   onSetViewMode={setViewMode}
                   onUpdateRating={updateCandidateRating}
                   onToggleShortlist={toggleShortlist}
                   onTogglePayment={togglePayment}
                   onRemoveFromView={handleRemoveFromView}
                   onBatchSelect={handleBatchSelect}
                   onProceedToNext={handleProceedToCheckout}
                   onOpenCheckout={() => setIsCheckoutOpen(true)}
                />
             ) : viewMode === 'purchased' && currentJob ? (
                <PurchasedCandidatesPage
                   jobId={currentJob.job_id}
                   employer={currentJob}
                   onBack={() => setViewMode('checkout')}
                />
             ) : null}
          </>
        ) : (
           <UploadPage 
              isLoading={isLoading}
              isSaving={isSaving}
              candidates={candidates}
              employers={employers}
              candidatesUploaded={candidatesUploaded}
              employersUploaded={employersUploaded}
              handleFileUpload={handleFileUpload}
              onProceed={() => employers.length > 0 && setSelectedJobId(employers[0].job_id)}
           />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
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
      
      <CheckoutModal
         isOpen={isCheckoutOpen}
         onClose={() => setIsCheckoutOpen(false)}
         items={matchResults.filter(r => paymentIds.has(r.candidate.candidate_id))}
         onProceed={handleCompletePurchase}
      />
    </div>
  );
}

export default App;