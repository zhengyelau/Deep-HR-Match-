import React from 'react';
import { User, Briefcase, Check, ArrowLeft, UserX, Building } from 'lucide-react';
import { Button, Card } from '../components/UI';
import { Candidate, Employer, CandidateExclusion, EmployerProfile } from '../types';

interface UploadPageProps {
  isLoading: boolean;
  isSaving: boolean;
  candidates: Candidate[];
  employers: Employer[];
  candidateExclusions: CandidateExclusion[];
  employerProfiles: EmployerProfile[];
  candidatesUploaded: boolean;
  employersUploaded: boolean;
  candidateExclusionsUploaded: boolean;
  employerProfilesUploaded: boolean;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, type: 'candidates' | 'employers' | 'candidateExclusions' | 'employerProfiles') => void;
  onProceed: () => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({
  isLoading,
  isSaving,
  candidates,
  employers,
  candidateExclusions,
  employerProfiles,
  candidatesUploaded,
  employersUploaded,
  candidateExclusionsUploaded,
  employerProfilesUploaded,
  handleFileUpload,
  onProceed,
}) => {
  return (
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
              <h2 className="text-xl font-bold text-slate-800">Job Data</h2>
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

        {/* Candidate Exclusions Upload */}
        <Card className="p-8 border-t-4 border-t-orange-500 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
              <UserX size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Candidate Exclusions</h2>
              <p className="text-sm text-slate-500">JSON Format</p>
            </div>
          </div>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50 transition-colors hover:bg-slate-50">
            <input
              type="file"
              accept=".json"
              onChange={(e) => handleFileUpload(e, 'candidateExclusions')}
              className="hidden"
              id="cand-excl-upload"
            />
            <label htmlFor="cand-excl-upload" className="cursor-pointer block w-full h-full">
              <Button variant="secondary" className="pointer-events-none mb-2">Select File</Button>
              <p className="text-sm text-slate-400">or drag and drop</p>
            </label>
            <div className="mt-4 min-h-[24px]">
              {isSaving && <span className="text-blue-600 font-semibold text-sm">Saving...</span>}
              {!isSaving && candidateExclusionsUploaded && candidateExclusions.length > 0 ? (
                <span className="text-green-600 font-semibold flex items-center justify-center gap-2 bg-green-50 py-1 px-3 rounded-full text-sm inline-block">
                  <Check size={14} /> {candidateExclusions.length} Exclusions Loaded
                </span>
              ) : !isSaving && <span className="text-slate-400 text-sm">No file chosen</span>}
            </div>
          </div>
        </Card>

        {/* Employer Profiles Upload */}
        <Card className="p-8 border-t-4 border-t-teal-500 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-teal-100 rounded-lg text-teal-600">
              <Building size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Employer Exclusions</h2>
              <p className="text-sm text-slate-500">JSON Format</p>
            </div>
          </div>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50 transition-colors hover:bg-slate-50">
            <input
              type="file"
              accept=".json"
              onChange={(e) => handleFileUpload(e, 'employerProfiles')}
              className="hidden"
              id="emp-prof-upload"
            />
            <label htmlFor="emp-prof-upload" className="cursor-pointer block w-full h-full">
              <Button variant="secondary" className="pointer-events-none mb-2">Select File</Button>
              <p className="text-sm text-slate-400">or drag and drop</p>
            </label>
            <div className="mt-4 min-h-[24px]">
              {isSaving && <span className="text-blue-600 font-semibold text-sm">Saving...</span>}
              {!isSaving && employerProfilesUploaded && employerProfiles.length > 0 ? (
                <span className="text-green-600 font-semibold flex items-center justify-center gap-2 bg-green-50 py-1 px-3 rounded-full text-sm inline-block">
                  <Check size={14} /> {employerProfiles.length} Profiles Loaded
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
             onClick={onProceed}
             className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-blue-600 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 hover:bg-blue-700 hover:scale-105 hover:shadow-xl"
          >
             Proceed to Dashboard
             <ArrowLeft className="mr-2 w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
};