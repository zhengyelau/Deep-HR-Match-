import React, { useState, useEffect } from 'react';
import { Download, UserCheck, ArrowLeft, CheckCircle2, Circle, Mail, Phone } from 'lucide-react';
import { Button, Card, Badge } from '../components/UI';
import { Avatar } from '../components/Avatar';
import { Candidate, Employer } from '../types';
import { purchasedCandidatesService, PurchasedCandidate } from '../services/purchasedCandidatesService';
import { candidatesService } from '../services/candidatesService';

interface PurchasedCandidatesPageProps {
  jobId: number;
  employer: Employer;
  onBack: () => void;
  onViewShortlisted: () => void;
}

export const PurchasedCandidatesPage: React.FC<PurchasedCandidatesPageProps> = ({
  jobId,
  employer,
  onBack,
  onViewShortlisted
}) => {
  const [purchasedCandidates, setPurchasedCandidates] = useState<PurchasedCandidate[]>([]);
  const [candidatesData, setCandidatesData] = useState<Record<number, Candidate>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingIds, setDownloadingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const loadPurchasedCandidates = async () => {
      setIsLoading(true);
      const purchased = await purchasedCandidatesService.getPurchasedCandidatesByJobId(jobId);
      setPurchasedCandidates(purchased);

      const candidateIds = purchased.map(p => p.candidate_id);
      const candidatesMap: Record<number, Candidate> = {};

      for (const id of candidateIds) {
        const candidate = await candidatesService.getCandidateById(id);
        if (candidate) {
          candidatesMap[id] = candidate;
        }
      }

      setCandidatesData(candidatesMap);
      setIsLoading(false);
    };

    loadPurchasedCandidates();
  }, [jobId]);

  const handleToggleInterviewShortlist = async (purchasedId: string, currentStatus: boolean) => {
    const success = await purchasedCandidatesService.toggleInterviewShortlist(purchasedId, !currentStatus);
    if (success) {
      setPurchasedCandidates(prev =>
        prev.map(pc =>
          pc.id === purchasedId ? { ...pc, is_shortlisted_for_interview: !currentStatus } : pc
        )
      );
    }
  };

  const handleDownloadCV = async (candidate: Candidate) => {
    setDownloadingIds(prev => new Set(prev).add(candidate.candidate_id));

    const cvContent = generateCVContent(candidate);
    const blob = new Blob([cvContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${candidate.first_name}_${candidate.last_name}_CV.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    setTimeout(() => {
      setDownloadingIds(prev => {
        const next = new Set(prev);
        next.delete(candidate.candidate_id);
        return next;
      });
    }, 1000);
  };

  const generateCVContent = (candidate: Candidate): string => {
    return `
═══════════════════════════════════════════════════════════
                    CURRICULUM VITAE
═══════════════════════════════════════════════════════════

PERSONAL INFORMATION
─────────────────────────────────────────────────────────
Name:              ${candidate.first_name} ${candidate.last_name}
Email:             ${candidate.email}
Phone:             ${candidate.phone}
Date of Birth:     ${candidate.date_of_birth}
Age:               ${candidate.age}
Gender:            ${candidate.gender}
Nationality:       ${candidate.nationality}
Current Location:  ${candidate.current_city}, ${candidate.current_country}

PROFESSIONAL SUMMARY
─────────────────────────────────────────────────────────
Availability:      ${candidate.availability}
Expected Salary:   $${candidate.minimum_expected_salary_monthly.toLocaleString()}/month
Job Arrangement:   ${candidate.desired_type_of_job_arrangement}
Visa Status:       ${candidate.visa_status}

PAST & CURRENT EXPERIENCE
─────────────────────────────────────────────────────────
Job Title:         ${candidate.past_current_title || 'N/A'}
Role:              ${candidate.past_current_role || 'N/A'}
Domain:            ${candidate.past_current_domain || 'N/A'}
Function:          ${candidate.past_current_function || 'N/A'}
Hierarchy:         ${candidate.past_current_hierarchy || 'N/A'}
Skills:            ${candidate.past_current_structural_skills || 'N/A'}
Systems:           ${candidate.past_current_system || 'N/A'}

EDUCATION
─────────────────────────────────────────────────────────
Subject:           ${candidate.past_current_education_subject || 'N/A'}
Major:             ${candidate.past_current_university_major || 'N/A'}
University Rank:   ${candidate.past_current_university_ranking || 'N/A'}

PREFERENCES
─────────────────────────────────────────────────────────
Desired Role:      ${candidate.preferred_role || 'N/A'}
Desired Domain:    ${candidate.preferred_domain || 'N/A'}
Desired Function:  ${candidate.preferred_function || 'N/A'}

PERSONAL ATTRIBUTES
─────────────────────────────────────────────────────────
Motivation:        ${candidate.past_current_motivation || 'N/A'}
Values:            ${candidate.past_current_values || 'N/A'}
Hobbies:           ${candidate.past_current_hobbies || 'N/A'}
Talents:           ${candidate.past_current_talents || 'N/A'}

═══════════════════════════════════════════════════════════
                End of Curriculum Vitae
═══════════════════════════════════════════════════════════
    `.trim();
  };

  const shortlistedCount = purchasedCandidates.filter(pc => pc.is_shortlisted_for_interview).length;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Loading purchased candidates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Purchased Candidates</h1>
            <p className="text-slate-600">
              {employer.job_title} - {employer.employer_name}
            </p>
          </div>
          <Button variant="secondary" onClick={onBack} className="bg-slate-700 text-white border-transparent hover:bg-slate-800">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Selection
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Purchased</h4>
            <p className="text-3xl font-bold text-blue-700">{purchasedCandidates.length}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Shortlisted for Interview</h4>
            <p className="text-3xl font-bold text-green-700">{shortlistedCount}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pending Review</h4>
            <p className="text-3xl font-bold text-amber-700">{purchasedCandidates.length - shortlistedCount}</p>
          </div>
        </div>
      </div>

      {purchasedCandidates.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCheck size={40} className="text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Purchased Candidates Yet</h3>
          <p className="text-slate-500 mb-6">You have not purchased any candidates for this job yet.</p>
          <Button onClick={onBack}>Go to Candidate Selection</Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {purchasedCandidates.map(purchased => {
            const candidate = candidatesData[purchased.candidate_id];
            if (!candidate) return null;

            const isDownloading = downloadingIds.has(candidate.candidate_id);

            return (
              <Card key={purchased.id} className="overflow-hidden border-2 border-slate-200 hover:border-blue-200 transition-all">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar
                        candidateId={candidate.candidate_id}
                        firstName={candidate.first_name}
                        lastName={candidate.last_name}
                        profilePictureUrl={candidate.profile_picture_url}
                        size="lg"
                        className="shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">
                          {candidate.first_name} {candidate.last_name}
                        </h3>

                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge color="blue">
                            {candidate.past_current_role?.split(',')[0] || 'Candidate'}
                          </Badge>
                          {purchased.is_shortlisted_for_interview && (
                            <Badge color="green" className="flex items-center gap-1">
                              <CheckCircle2 size={12} />
                              Shortlisted for Interview
                            </Badge>
                          )}
                          <Badge color="purple">
                            Purchased {new Date(purchased.purchase_date).toLocaleDateString()}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Mail size={14} className="text-slate-400" />
                            <span className="truncate">{candidate.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Phone size={14} className="text-slate-400" />
                            <span>{candidate.phone}</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-xs text-slate-500 uppercase tracking-wide font-bold block mb-1">Salary</span>
                              <span className="font-semibold text-slate-900">${candidate.minimum_expected_salary_monthly.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-xs text-slate-500 uppercase tracking-wide font-bold block mb-1">Availability</span>
                              <span className="font-semibold text-slate-900">{candidate.availability}</span>
                            </div>
                            <div>
                              <span className="text-xs text-slate-500 uppercase tracking-wide font-bold block mb-1">Location</span>
                              <span className="font-semibold text-slate-900">{candidate.current_city || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-xs text-slate-500 uppercase tracking-wide font-bold block mb-1">Visa Status</span>
                              <span className="font-semibold text-slate-900">{candidate.visa_status}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex lg:flex-col gap-3 lg:justify-start shrink-0">
                      <Button
                        onClick={() => handleDownloadCV(candidate)}
                        isLoading={isDownloading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 flex items-center gap-2 whitespace-nowrap"
                      >
                        <Download size={16} />
                        Download CV
                      </Button>

                      <Button
                        onClick={() => handleToggleInterviewShortlist(purchased.id, purchased.is_shortlisted_for_interview)}
                        variant={purchased.is_shortlisted_for_interview ? "success" : "secondary"}
                        className={`px-4 py-2 flex items-center gap-2 whitespace-nowrap ${
                          purchased.is_shortlisted_for_interview
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'border-slate-300 hover:border-green-300 hover:text-green-600'
                        }`}
                      >
                        {purchased.is_shortlisted_for_interview ? (
                          <>
                            <CheckCircle2 size={16} />
                            Shortlisted
                          </>
                        ) : (
                          <>
                            <Circle size={16} />
                            Shortlist for Interview
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          {shortlistedCount > 0 && (
            <div className="mt-8 flex justify-end animate-in fade-in slide-in-from-bottom-2 sticky bottom-4 z-10 pointer-events-none">
              <Button
                size="lg"
                onClick={onViewShortlisted}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg rounded-full flex items-center gap-2 font-bold shadow-xl transition-all hover:scale-105 pointer-events-auto"
              >
                <CheckCircle2 className="w-5 h-5" />
                View Shortlisted Candidates ({shortlistedCount})
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
