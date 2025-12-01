import { Candidate, Employer, MatchDetails, MatchResult } from '../types';

// Helper: Parse comma separated string to array
const parseList = (str?: string): string[] => {
  if (!str) return [];
  return str.split(',').map(s => s.trim().toLowerCase()).filter(s => s.length > 0);
};

// Helper: Availability Hierarchy
const getAvailabilityScore = (avail: string): number => {
  const map: Record<string, number> = {
    'immediate': 0,
    '1 week': 1,
    '2 weeks': 2,
    '1 month': 3,
    '2 months': 4,
    '3 months': 5
  };
  // Return -1 for unknown values (e.g. "Other") to prevent automatic elimination
  // Logic: Benefit of the doubt for non-standard values
  return map[(avail || '').toLowerCase()] ?? -1;
};

// Helper: Parse Age Range "25-35"
const parseRange = (range?: string): { min: number, max: number } | null => {
  if (!range) return null;
  const parts = range.split('-').map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { min: parts[0], max: parts[1] };
  }
  return null;
};

// 1. Elimination Logic
export const checkElimination = (candidate: Candidate, employer: Employer): { eliminated: boolean, reasons: string[] } => {
  const reasons: string[] = [];
  const criteria = employer.elimination_criteria;

  // Age
  if (criteria.age) {
    const range = parseRange(criteria.age);
    if (range) {
      if (candidate.age < range.min || candidate.age > range.max) {
        reasons.push(`Age ${candidate.age} outside range ${criteria.age}`);
      }
    }
  }

  // Exact Matches (Case insensitive, allow "Any")
  const checkExact = (fieldVal: string, criteriaVal: string | undefined, fieldName: string) => {
    if (criteriaVal && criteriaVal !== 'Any' && fieldVal.toLowerCase() !== criteriaVal.toLowerCase()) {
      reasons.push(`${fieldName} mismatch`);
    }
  };

  checkExact(candidate.ethnicity, criteria.ethnicity, 'Ethnicity');
  checkExact(candidate.race, criteria.race, 'Race');
  checkExact(candidate.religion || '', criteria.religion, 'Religion');
  checkExact(candidate.nationality, criteria.nationality, 'Nationality');
  checkExact(candidate.country_of_birth, criteria.country_of_birth, 'Birth Country');
  checkExact(candidate.current_country, criteria.current_country, 'Current Country');
  checkExact(candidate.visa_status, criteria.visa_status, 'Visa Status');
  checkExact(candidate.desired_type_of_job_arrangement, criteria.job_arrangement, 'Job Arrangement');

  // Salary (Candidate expectation <= Employer max)
  if (criteria.salary_monthly) {
    if (candidate.minimum_expected_salary_monthly > criteria.salary_monthly) {
      reasons.push('Salary expectation too high');
    }
  }

  // Availability (Candidate avail <= Employer requirement)
  if (criteria.availability && criteria.availability !== 'Any') {
    const candScore = getAvailabilityScore(candidate.availability);
    const reqScore = getAvailabilityScore(criteria.availability);
    
    // Eliminate only if both are standard values and candidate is slower than required.
    // If candScore is -1 (Other/Unknown), we assume they pass or require manual check.
    if (candScore !== -1 && reqScore !== -1 && candScore > reqScore) {
      reasons.push(`Availability ${candidate.availability} too late`);
    }
  }

  return { eliminated: reasons.length > 0, reasons };
};

// 2. Scoring Logic
export const calculateScore = (candidate: Candidate, employer: Employer): MatchDetails => {
  let totalScore = 0;
  let maxPossibleScore = 0; // Dynamic based on what the employer actually requires
  const breakdown: MatchDetails['breakdown'] = [];

  const categories = Object.keys(employer.required_matching_criteria);

  categories.forEach(category => {
    const reqsObj = employer.required_matching_criteria[category];
    if (!reqsObj) return;

    // Extract employer requirements for this category
    const requirements = [reqsObj.field1, reqsObj.field2, reqsObj.field3]
      .filter((f): f is string => !!f && f !== 'Any');
    
    if (requirements.length === 0) return;

    // Determine candidate fields dynamically based on category name
    // e.g., category 'motivation' -> candidate.past_current_motivation & candidate.preferred_motivation
    const pastKey = `past_current_${category}` as keyof Candidate;
    const prefKey = `preferred_${category}` as keyof Candidate;

    const pastValues = parseList(candidate[pastKey] as string);
    const prefValues = parseList(candidate[prefKey] as string);

    let categoryScore = 0;
    const pastMatches: string[] = [];
    const prefMatches: string[] = [];

    requirements.forEach(req => {
        const reqLower = req.toLowerCase();
        
        // 3 Points for Past/Current
        if (pastValues.includes(reqLower)) {
            categoryScore += 3;
            pastMatches.push(req);
        }

        // 1 Point for Preferred
        if (prefValues.includes(reqLower)) {
            categoryScore += 1;
            prefMatches.push(req);
        }
    });

    // Calculate max score for this category: (num_requirements * 3) + (num_requirements * 1)
    // Assuming a candidate *could* match both past and preferred for every requirement
    maxPossibleScore += (requirements.length * 4);
    
    totalScore += categoryScore;

    if (categoryScore > 0) {
        breakdown.push({
            category: category.replace(/_/g, ' '),
            score: categoryScore,
            pastCurrentMatches: pastMatches,
            preferredMatches: prefMatches
        });
    }
  });

  // Prevent divide by zero if no requirements
  const percentage = maxPossibleScore > 0 
    ? Math.round((totalScore / maxPossibleScore) * 100) 
    : 0;

  return { totalScore, percentage, breakdown };
};

export const processCandidates = (candidates: Candidate[], employer: Employer): MatchResult[] => {
  const results = candidates.map(candidate => {
    const elimResult = checkElimination(candidate, employer);
    if (elimResult.eliminated) {
      return {
        candidate,
        rank: 0,
        score: 0,
        percentage: 0,
        isEliminated: true,
        eliminationReasons: elimResult.reasons,
        details: { totalScore: 0, percentage: 0, breakdown: [] }
      };
    }

    const matchDetails = calculateScore(candidate, employer);
    return {
      candidate,
      rank: 0, // Assigned later
      score: matchDetails.totalScore,
      percentage: matchDetails.percentage,
      isEliminated: false,
      eliminationReasons: [],
      details: matchDetails
    };
  });

  // Filter out eliminated, sort by score desc, then assign rank
  const activeResults = results.filter(r => !r.isEliminated);
  activeResults.sort((a, b) => b.score - a.score);

  activeResults.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  return activeResults;
};
