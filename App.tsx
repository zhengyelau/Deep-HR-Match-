import React, { useState, useEffect, useRef } from 'react';
import { Brain, Briefcase, User, Check, ShoppingCart, X, ArrowLeft, Info, Calendar, DollarSign, Clock, BookOpen, GraduationCap, Zap, Network, Eye, LogOut, FileQuestion, Activity } from 'lucide-react';
import { Candidate, Employer, MatchResult } from './types';
import { processCandidates } from './utils/scoring';
import { Button, Card, Badge } from './components/UI';
import { Histogram } from './components/Charts';

function App() {
  // State
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  
  // Selection
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'distribution' | 'details'>('distribution');
  const [checkoutIds, setCheckoutIds] = useState<Set<number>>(new Set());
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Computed
  const currentJob = employers.find(e => e.job_id === selectedJobId);
  const selectedCount = selectedCandidateIds.size;
  const selectedMatches = matchResults.filter(r => selectedCandidateIds.has(r.candidate.candidate_id));

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

  // Load from Local Storage on Mount
  useEffect(() => {
    const storedCand = localStorage.getItem('dhm_candidates');
    const storedEmp = localStorage.getItem('dhm_employers');
    if (storedCand) {
      try { setCandidates(JSON.parse(storedCand)); } catch(e) {}
    }
    if (storedEmp) {
      try { setEmployers(JSON.parse(storedEmp)); } catch(e) {}
    }
  }, []);

  // Process Matches when job or candidates change
  useEffect(() => {
    if (currentJob && candidates.length > 0) {
      const results = processCandidates(candidates, currentJob);
      setMatchResults(results);
      // Reset selections on new job
      setSelectedCandidateIds(new Set());
      setCheckoutIds(new Set());
    }
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
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        if (type === 'candidates') {
            if(!Array.isArray(json)) throw new Error("Candidates must be an array");
            setCandidates(json);
            localStorage.setItem('dhm_candidates', JSON.stringify(json));
        } else {
            if(!Array.isArray(json)) throw new Error("Employers must be an array");
            setEmployers(json);
            localStorage.setItem('dhm_employers', JSON.stringify(json));
        }
      } catch (err) {
        alert("Invalid JSON file format");
      }
    };
    reader.readAsText(file);
  };

  // Handler: Toggle Selection
  const toggleSelection = (id: number) => {
    const newSet = new Set(selectedCandidateIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedCandidateIds(newSet);
  };

  // Scroll to Chart
  const scrollToChart = (key: keyof typeof chartRefs) => {
    chartRefs[key].current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // --- Views ---

  const UploadView = () => (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in duration-500">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Deep HR Match Configuration</h1>
        <p className="text-slate-600">Upload your data to begin the AI-powered matching process.</p>
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
              {candidates.length > 0 ? (
                <span className="text-green-600 font-semibold flex items-center justify-center gap-2 bg-green-50 py-1 px-3 rounded-full text-sm inline-block">
                  <Check size={14} /> {candidates.length} Candidates Loaded
                </span>
              ) : <span className="text-slate-400 text-sm">No file chosen</span>}
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
              {employers.length > 0 ? (
                <span className="text-green-600 font-semibold flex items-center justify-center gap-2 bg-green-50 py-1 px-3 rounded-full text-sm inline-block">
                  <Check size={14} /> {employers.length} Jobs Loaded
                </span>
              ) : <span className="text-slate-400 text-sm">No file chosen</span>}
            </div>
          </div>
        </Card>
      </div>

      {candidates.length > 0 && employers.length > 0 && (
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
    const items = matchResults.filter(r => checkoutIds.has(r.candidate.candidate_id));
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
             <span><span className="font-bold text-blue-800">Scroll down and click</span> the "View Selected Candidates" button to see detailed information and proceed to checkout.</span>
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

  // Helper for Questionnaire items
  const QuestionItem = ({ question, answer }: { question: string, answer: string }) => {
     if (!answer) return null;
     const isYes = answer.toLowerCase() === 'yes';
     const isNo = answer.toLowerCase() === 'no';
     
     return (
        <div className="bg-white p-3 rounded border border-cyan-100 shadow-sm flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{question}</span>
            <div className="flex items-center gap-2">
                <span className={`font-semibold ${isYes ? 'text-green-600' : isNo ? 'text-slate-900' : 'text-slate-700'}`}>
                    {answer}
                </span>
            </div>
        </div>
     );
  };

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
            {viewMode === 'distribution' ? (
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
                  
                  {/* Grid Layout for Charts - Stacked Vertically */}
                  
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
              // Details View - REDESIGNED
              <div className="max-w-7xl mx-auto px-4 py-8">
                
                {/* 1. Header Row */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                   <h2 className="text-2xl font-bold text-slate-900">Shortlisted Candidate Details</h2>
                   <div className="flex items-center gap-3">
                       <span className="text-slate-500 text-sm">Viewing {selectedMatches.length} candidates</span>
                       <Button variant="secondary" onClick={() => setViewMode('distribution')} className="bg-slate-700 text-white border-transparent hover:bg-slate-800">
                          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Distribution
                       </Button>
                   </div>
                </div>

                {/* 2. Blue Instruction Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 flex items-start gap-4">
                    <div className="bg-blue-600 text-white rounded-full p-2 mt-1 shrink-0">
                        <span className="font-bold text-xl px-2">!</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-blue-900 mb-3">How to Use This Page</h3>
                        <ol className="space-y-2 text-blue-900/80 text-base">
                            <li className="flex gap-2">
                                <span className="font-bold text-blue-700">1.</span>
                                <span><span className="font-bold">Review the detailed information</span> for each shortlisted candidate below.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="font-bold text-blue-700">2.</span>
                                <span>Use the <span className="font-bold">"Select Candidate" checkbox</span> to choose candidates for checkout. Click the <span className="inline-flex items-center justify-center w-5 h-5 bg-slate-200 text-slate-600 rounded text-xs mx-1">×</span> button to remove a candidate from your shortlist.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="font-bold text-blue-700">3.</span>
                                <span><span className="font-bold">When you're ready to proceed</span>, click the "Proceed to Checkout" button at the bottom right.</span>
                            </li>
                        </ol>
                    </div>
                </div>
              
                {/* 3. Stats Cards (Green, Orange, Pink) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  {/* Green */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 shadow-sm">
                     <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">NUMBER OF CANDIDATES</h4>
                     <p className="text-4xl font-bold text-emerald-800">{selectedMatches.length}</p>
                  </div>
                  {/* Orange */}
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 shadow-sm">
                     <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">LOWEST MATCH SCORE</h4>
                     <p className="text-4xl font-bold text-orange-700">
                         {selectedMatches.length > 0 ? Math.min(...selectedMatches.map(m => m.score)) : 0}
                     </p>
                  </div>
                  {/* Pink */}
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 shadow-sm">
                     <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">HIGHEST MATCH SCORE</h4>
                     <p className="text-4xl font-bold text-rose-700">
                         {selectedMatches.length > 0 ? Math.max(...selectedMatches.map(m => m.score)) : 0}
                     </p>
                  </div>
                </div>

                {/* 4. Unified Candidates Card */}
                <div className="pb-24">
                  <Card className="overflow-hidden border border-slate-200 shadow-sm">
                    <div className="p-6 md:p-8">
                      <div className="space-y-12">
                        {selectedMatches.map((res, index) => {
                            const isSelected = checkoutIds.has(res.candidate.candidate_id);
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
                                                            {res.score} {/* Approximation for max potential */}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions Right */}
                                        <div className="flex items-center gap-3 self-end lg:self-auto">
                                            <label className={`
                                                flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all select-none
                                                ${isSelected 
                                                    ? 'bg-blue-50 border-blue-500 text-blue-700' 
                                                    : 'bg-white border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600'}
                                            `}>
                                                <input 
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => {
                                                         const next = new Set(checkoutIds);
                                                         if (next.has(res.candidate.candidate_id)) next.delete(res.candidate.candidate_id);
                                                         else next.add(res.candidate.candidate_id);
                                                         setCheckoutIds(next);
                                                    }}
                                                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="font-bold">Select Candidate</span>
                                            </label>
                                            <button 
                                                onClick={() => toggleSelection(res.candidate.candidate_id)}
                                                className="p-2.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors"
                                                title="Remove Candidate"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* PURPLE SECTION: Matching Details */}
                                    <div className="bg-purple-50 rounded-lg border border-purple-100 p-5 mb-4">
                                        <h4 className="text-lg font-bold text-slate-900 mb-4">Matching Details</h4>
                                        <h5 className="text-base font-bold text-slate-700 mb-2">What Matched</h5>
                                        
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
                                             <h4 className="text-lg font-bold text-slate-900 mb-4">Elimination Criteria & Profile</h4>
                                             <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
                                                {/* Row 1 */}
                                                <div><div className="text-xs font-bold text-slate-500">Age</div><div className="text-sm font-medium text-slate-900">{res.candidate.age}</div></div>
                                                <div><div className="text-xs font-bold text-slate-500">Gender</div><div className="text-sm font-medium text-slate-900">{res.candidate.gender}</div></div>
                                                <div><div className="text-xs font-bold text-slate-500">DOB</div><div className="text-sm font-medium text-slate-900">{res.candidate.date_of_birth}</div></div>
                                                
                                                {/* Row 2 */}
                                                <div><div className="text-xs font-bold text-slate-500">Nationality</div><div className="text-sm font-medium text-slate-900">{res.candidate.nationality}</div></div>
                                                <div><div className="text-xs font-bold text-slate-500">Birth Country</div><div className="text-sm font-medium text-slate-900">{res.candidate.country_of_birth}</div></div>
                                                
                                                {/* Row 3 */}
                                                <div><div className="text-xs font-bold text-slate-500">Current Country</div><div className="text-sm font-medium text-slate-900">{res.candidate.current_country}</div></div>
                                                <div><div className="text-xs font-bold text-slate-500">Min Salary</div><div className="text-sm font-medium text-slate-900">${res.candidate.minimum_expected_salary_monthly.toLocaleString()}</div></div>
                                                <div><div className="text-xs font-bold text-slate-500">Availability</div><div className="text-sm font-medium text-slate-900">{res.candidate.availability}</div></div>
                                                <div><div className="text-xs font-bold text-slate-500">Visa Status</div><div className="text-sm font-medium text-slate-900">{res.candidate.visa_status}</div></div>

                                                {/* Row 4: New Profile Data */}
                                                {res.candidate.fitness_level && <div><div className="text-xs font-bold text-slate-500">Fitness</div><div className="text-sm font-medium text-slate-900">{res.candidate.fitness_level}</div></div>}
                                                {res.candidate.height_cm && <div><div className="text-xs font-bold text-slate-500">Height/Weight</div><div className="text-sm font-medium text-slate-900">{res.candidate.height_cm}cm / {res.candidate.weight_kg}kg</div></div>}
                                                <div className="md:col-span-1"><div className="text-xs font-bold text-slate-500">Email</div><div className="text-sm font-medium text-slate-900 break-all" title={res.candidate.email}>{res.candidate.email}</div></div>
                                                <div className="md:col-span-1"><div className="text-xs font-bold text-slate-500">Phone</div><div className="text-sm font-medium text-slate-900">{res.candidate.phone}</div></div>
                                             </div>
                                        </div>
                                        
                                        {/* CYAN SECTION: Questionnaire */}
                                        {q && (
                                            <div className="bg-cyan-50 rounded-lg border border-cyan-100 p-5 h-full">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <FileQuestion className="text-cyan-600" size={20} />
                                                    <h4 className="text-lg font-bold text-slate-900">Questionnaire</h4>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <QuestionItem question="Overtime / Weekends" answer={q.q1_overtime_or_weekends} />
                                                    <QuestionItem question="Driving License" answer={q.q2_driving_license} />
                                                    <QuestionItem question="Own Car" answer={q.q3_own_car} />
                                                    <QuestionItem question="Willing to Travel" answer={q.q4_willing_to_travel} />
                                                    <QuestionItem question="Right to Work" answer={q.q5_legal_right_to_work} />
                                                    <QuestionItem question="Degree / Education" answer={q.q6_bachelor_degree_or_required_education} />
                                                    <QuestionItem question="Years Experience" answer={q.q7_required_years_experience} />
                                                    <QuestionItem question="Full Time" answer={q.q8_willing_full_time} />
                                                    <QuestionItem question="Relocate" answer={q.q9_willing_to_relocate} />
                                                    <QuestionItem question="Background Check" answer={q.q10_comfortable_with_background_checks} />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            );
                        })}
                      </div>

                      {/* Checkout Footer */}
                      {checkoutIds.size > 0 && (
                          <div className="mt-8 pt-8 border-t border-slate-100 flex justify-end animate-in fade-in slide-in-from-bottom-2">
                             <Button 
                                size="lg" 
                                onClick={() => {
                                    const ids = new Set(checkoutIds);
                                    if (ids.size === 0) {
                                        alert("Please select at least one candidate using the checkboxes.");
                                        return;
                                    }
                                    setIsCheckoutOpen(true);
                                }} 
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg rounded-lg flex items-center gap-2 font-bold shadow-md transition-all hover:shadow-lg"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                Proceed to Checkout ({checkoutIds.size} Candidate{checkoutIds.size !== 1 ? 's' : ''})
                            </Button>
                          </div>
                      )}
                    </div>
                  </Card>
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

      <CheckoutModal />
    </div>
  );
}

export default App;