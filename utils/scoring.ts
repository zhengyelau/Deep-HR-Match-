import { Candidate, Employer, MatchDetails, MatchResult, CandidateExclusion, EmployerProfile } from '../types';

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

// 0. Candidate Exclusion Logic - Check if candidate has excluded this employer
export const checkCandidateExclusion = (
  candidate: Candidate,
  employer: Employer,
  candidateExclusion: CandidateExclusion | null,
  employerProfile: EmployerProfile | null
): { excluded: boolean, reasons: string[] } => {
  const reasons: string[] = [];

  if (!candidateExclusion || !employerProfile) {
    return { excluded: false, reasons: [] };
  }

  // 1. Check if candidate excluded this employer by name
  if (candidateExclusion.excluded_employer_name && candidateExclusion.excluded_employer_name.length > 0) {
    const excludedNames = candidateExclusion.excluded_employer_name.map(name => name.toLowerCase());
    if (excludedNames.includes(employer.employer_name.toLowerCase())) {
      reasons.push(`Candidate excluded employer: ${employer.employer_name}`);
    }
  }

  // 2. Check if candidate excluded any of the employer's races
  if (candidateExclusion.excluded_employer_race && candidateExclusion.excluded_employer_race.length > 0) {
    const excludedRaces = candidateExclusion.excluded_employer_race.map(race => race.toLowerCase());
    const employerRaces = employerProfile.employer_race.map(race => race.toLowerCase());
    const matchingRaces = employerRaces.filter(race => excludedRaces.includes(race));

    if (matchingRaces.length > 0) {
      reasons.push(`Candidate excluded employer race: ${matchingRaces.join(', ')}`);
    }
  }

  // 3. Check if candidate excluded any of the employer's religions
  if (candidateExclusion.excluded_employer_religion && candidateExclusion.excluded_employer_religion.length > 0) {
    const excludedReligions = candidateExclusion.excluded_employer_religion.map(religion => religion.toLowerCase());
    const employerReligions = employerProfile.employer_religion.map(religion => religion.toLowerCase());
    const matchingReligions = employerReligions.filter(religion => excludedReligions.includes(religion));

    if (matchingReligions.length > 0) {
      reasons.push(`Candidate excluded employer religion: ${matchingReligions.join(', ')}`);
    }
  }

  // 4. Check if candidate excluded any of the employer's genders
  if (candidateExclusion.excluded_employer_gender && candidateExclusion.excluded_employer_gender.length > 0) {
    const excludedGenders = candidateExclusion.excluded_employer_gender.map(gender => gender.toLowerCase());
    const employerGenders = employerProfile.employer_gender.map(gender => gender.toLowerCase());
    const matchingGenders = employerGenders.filter(gender => excludedGenders.includes(gender));

    if (matchingGenders.length > 0) {
      reasons.push(`Candidate excluded employer gender: ${matchingGenders.join(', ')}`);
    }
  }

  // 5. Check if candidate excluded any of the employer's countries
  if (candidateExclusion.excluded_emplyer_country && candidateExclusion.excluded_emplyer_country.length > 0) {
    const excludedCountries = candidateExclusion.excluded_emplyer_country.map(country => country.toLowerCase());
    const employerCountries = employerProfile.employer_country.map(country => country.toLowerCase());
    const matchingCountries = employerCountries.filter(country => excludedCountries.includes(country));

    if (matchingCountries.length > 0) {
      reasons.push(`Candidate excluded employer country: ${matchingCountries.join(', ')}`);
    }
  }

  // 6. Check if candidate excluded any of the employer's cities
  if (candidateExclusion.excluded_employer_city && candidateExclusion.excluded_employer_city.length > 0) {
    const excludedCities = candidateExclusion.excluded_employer_city.map(city => city.toLowerCase());
    const employerCities = employerProfile.employer_city.map(city => city.toLowerCase());
    const matchingCities = employerCities.filter(city => excludedCities.includes(city));

    if (matchingCities.length > 0) {
      reasons.push(`Candidate excluded employer city: ${matchingCities.join(', ')}`);
    }
  }

  // 7. Check if candidate excluded the employer's incorporation date
  if (candidateExclusion.excluded_employer_incorporation_date && candidateExclusion.excluded_employer_incorporation_date.length > 0) {
    const excludedDates = candidateExclusion.excluded_employer_incorporation_date.map(date => date.toLowerCase());
    if (excludedDates.includes(employerProfile.incorporation_date.toLowerCase())) {
      reasons.push(`Candidate excluded employer incorporation date: ${employerProfile.incorporation_date}`);
    }
  }

  // 8. Check if employer size exceeds candidate's excluded size threshold
  if (candidateExclusion.excluded_employer_size && candidateExclusion.excluded_employer_size > 0) {
    if (employerProfile.employer_size >= candidateExclusion.excluded_employer_size) {
      reasons.push(`Candidate excluded employers with size >= ${candidateExclusion.excluded_employer_size} (employer size: ${employerProfile.employer_size})`);
    }
  }

  return { excluded: reasons.length > 0, reasons };
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

export const processCandidates = (
  candidates: Candidate[],
  employer: Employer,
  candidateExclusions: CandidateExclusion[] = [],
  employerProfile: EmployerProfile | null = null
): MatchResult[] => {
  const results = candidates.map(candidate => {
    // 0. Check if candidate has excluded this employer (happens FIRST)
    const candidateExclusion = candidateExclusions.find(exc => exc.candidate_id === candidate.candidate_id) || null;
    const exclusionResult = checkCandidateExclusion(candidate, employer, candidateExclusion, employerProfile);

    if (exclusionResult.excluded) {
      return {
        candidate,
        rank: 0,
        score: 0,
        percentage: 0,
        isEliminated: true,
        eliminationReasons: exclusionResult.reasons,
        details: { totalScore: 0, percentage: 0, breakdown: [] }
      };
    }

    // 1. Check standard elimination criteria
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

    // 2. Calculate match score
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
