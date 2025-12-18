import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Mail, Phone, Download, CheckCircle2, Building2 } from 'lucide-react';
import { Button, Card, Badge } from '../components/UI';
import { Avatar } from '../components/Avatar';
import { Candidate, Employer } from '../types';
import { purchasedCandidatesService, PurchasedCandidate } from '../services/purchasedCandidatesService';
import { candidatesService } from '../services/candidatesService';
import { employersService } from '../services/employersService';

interface ShortlistedCandidatesPageProps {
  jobId: number;
  employer: Employer;
  onBack: () => void;
  onViewPeopleFromCompany: (employer: Employer) => void;
}

export const ShortlistedCandidatesPage: React.FC<ShortlistedCandidatesPageProps> = ({
  jobId,
  employer,
  onBack,
  onViewPeopleFromCompany
}) => {
  const [shortlistedCandidates, setShortlistedCandidates] = useState<PurchasedCandidate[]>([]);
  const [candidatesData, setCandidatesData] = useState<Record<number, Candidate>>({});
  const [employersData, setEmployersData] = useState<Record<number, Employer>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingIds, setDownloadingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const loadShortlistedCandidates = async () => {
      setIsLoading(true);
      const shortlisted = await purchasedCandidatesService.getAllShortlistedCandidates();
      setShortlistedCandidates(shortlisted);

      const candidateIds = shortlisted.map(p => p.candidate_id);
      const candidatesMap: Record<number, Candidate> = {};

      for (const id of candidateIds) {
        const candidate = await candidatesService.getCandidateById(id);
        if (candidate) {
          candidatesMap[id] = candidate;
        }
      }

      const jobIds = [...new Set(shortlisted.map(p => p.job_id))];
      const employersMap: Record<number, Employer> = {};

      for (const id of jobIds) {
        const employer = await employersService.getEmployerByJobId(id);
        if (employer) {
          employersMap[id] = employer;
        }
      }

      setCandidatesData(candidatesMap);
      setEmployersData(employersMap);
      setIsLoading(false);
    };

    loadShortlistedCandidates();
  }, []);

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

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Loading shortlisted candidates...</p>
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
            <h1 className="text-3xl font-bold text-slate-900 mb-2">All Shortlisted Candidates for Interview</h1>
            <p className="text-slate-600">
              Showing shortlisted candidates from all job positions
            </p>
          </div>
          <Button variant="secondary" onClick={onBack} className="bg-slate-700 text-white border-transparent hover:bg-slate-800">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Purchased
          </Button>
        </div>
      </div>

      {shortlistedCandidates.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={40} className="text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Shortlisted Candidates Yet</h3>
          <p className="text-slate-500 mb-6">You have not shortlisted any candidates for interview yet.</p>
          <Button onClick={onBack}>Go Back to Purchased Candidates</Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {shortlistedCandidates.map(purchased => {
            const candidate = candidatesData[purchased.candidate_id];
            const purchasedEmployer = employersData[purchased.job_id];
            if (!candidate) return null;

            const isDownloading = downloadingIds.has(candidate.candidate_id);

            return (
              <Card key={purchased.id} className="overflow-hidden border-2 border-green-200 hover:border-green-300 transition-all shadow-md">
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
                          <Badge color="green" className="flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            Shortlisted for Interview
                          </Badge>
                          {purchasedEmployer && (
                            <Badge color="orange" className="flex items-center gap-1">
                              <Building2 size={12} />
                              {purchasedEmployer.employer_name}
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
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 flex items-center gap-2 whitespace-nowrap"
                      >
                        <Download size={16} />
                        Download CV
                      </Button>

                      {purchasedEmployer && (
                        <Button
                          onClick={() => onViewPeopleFromCompany(purchasedEmployer)}
                          variant="secondary"
                          className="px-4 py-2 flex items-center gap-2 whitespace-nowrap border-slate-300 bg-slate-50 hover:bg-blue-50 hover:border-blue-300"
                        >
                          <Building2 size={16} />
                          Company {purchasedEmployer.employer_name}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
