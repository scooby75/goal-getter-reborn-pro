import { useQuery } from '@tanstack/react-query';
import Papa from 'papaparse';

export type HeadToHeadMatch = {
  Date: string;
  Team_Home: string;
  Team_Away: string;
  Goals_Home: number;
  Goals_Away: number;
  Result: string;
  Score?: string;
  HT_Score?: string;
  League?: string;
};

// CSV source URLs
const CSV_URLS = [
  '/Data/all_leagues_results.csv',
  '/Data/all_leagues_results_2024.csv',
];

// Enhanced fetch function with timeout
const fetchCSVData = async (): Promise<string> => {
  console.log('=== FETCH CSV DATA ===');

  for (const url of CSV_URLS) {
    try {
      console.log(`🔄 Attempting URL: ${url}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/csv,text/plain,*/*',
          'Cache-Control': 'no-cache',
        },
        mode: url.startsWith('http') ? 'cors' : 'same-origin',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`❌ Failed URL: ${url} - Status: ${response.status}`);
        continue;
      }

      const csvText = await response.text();
      if (csvText?.trim().length > 100) {
        console.log(`✅ Successfully loaded CSV from: ${url}`);
        console.log(`📊 CSV size: ${csvText.length} characters`);
        return csvText;
      }

      console.warn(`⚠️ Empty or too small CSV from URL: ${url}`);
    } catch (error) {
      console.warn(`❌ Error fetching URL: ${url}`, error);
    }
  }

  throw new Error('Failed to load match data from all available sources');
};

// Normalization utility with memoization
const normalize = (() => {
  const cache = new Map<string, string>();
  return (str: string): string => {
    if (!str) return '';
    if (cache.has(str)) return cache.get(str)!;
    
    const normalized = str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
    
    cache.set(str, normalized);
    return normalized;
  };
})();

// Improved CSV parser with better validation
const parseHeadToHeadCSV = (csvText: string): HeadToHeadMatch[] => {
  console.log('=== PARSE CSV ===');

  if (!csvText || typeof csvText !== 'string') {
    console.error('Invalid csvText:', csvText);
    return [];
  }

  try {
    const result = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
      transform: (value) => value?.trim() || '',
    });

    if (!result?.data) {
      console.error('Invalid parse result:', result);
      return [];
    }

    if (result.errors?.length) {
      console.error('CSV parse errors:', result.errors);
    }

    const rows = Array.isArray(result.data) ? result.data : [];
    console.log(`CSV rows read: ${rows.length}`);

    return rows.reduce<HeadToHeadMatch[]>((matches, row, index) => {
      try {
        let homeGoals = 0;
        let awayGoals = 0;
        const scoreRaw = row.Score || '';

        // Parse score if available
        if (typeof scoreRaw === 'string' && scoreRaw.includes('-')) {
          const [homeStr, awayStr] = scoreRaw.split('-').map(s => s.trim());
          homeGoals = parseInt(homeStr, 10) || 0;
          awayGoals = parseInt(awayStr, 10) || 0;
        }

        // Determine match result
        let resultStr = '';
        if (!isNaN(homeGoals) && !isNaN(awayGoals)) {
          resultStr = homeGoals > awayGoals ? 'H' 
                   : homeGoals < awayGoals ? 'A' 
                   : 'D';
        }

        matches.push({
          Date: row.Date || row.Data || '',
          Team_Home: row.HomeTeam || row.Team_Home || '',
          Team_Away: row.AwayTeam || row.Team_Away || '',
          Goals_Home: homeGoals,
          Goals_Away: awayGoals,
          Result: resultStr,
          Score: scoreRaw,
          HT_Score: row.HT_Score || row['HT Score'] || row.HTScore || '',
          League: row.League || 'Unknown',
        });
      } catch (error) {
        console.warn(`❌ Error processing row ${index + 1}:`, error);
      }
      return matches;
    }, []);
  } catch (error) {
    console.error('Failed to parse CSV:', error);
    return [];
  }
};

// Date handling utility with format validation
const safeDate = (dateStr: string): Date => {
  // Try common date formats
  const formats = [
    'YYYY-MM-DD', 
    'DD/MM/YYYY',
    'MM/DD/YYYY'
  ];
  
  for (const format of formats) {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date;
  }
  
  return new Date(0); // Fallback to epoch
};

// Main hook with robust error handling
export const useHeadToHead = (team1?: string, team2?: string) => {
  return useQuery<HeadToHeadMatch[]>({
    queryKey: ['headToHead', team1, team2],
    queryFn: async () => {
      console.log('🔍 Fetching matches for:', { team1, team2 });

      try {
        const csvText = await fetchCSVData();
        const allMatches = parseHeadToHeadCSV(csvText) || [];
        console.log(`📊 Total matches loaded: ${allMatches.length}`);

        // Runtime type checking
        if (!Array.isArray(allMatches)) {
          console.error('Expected array but got:', typeof allMatches);
          return [];
        }

        if (!team1 && !team2) {
          console.log('🔄 No teams specified, returning first 50 matches');
          return allMatches.slice(0, 6);
        }

        const t1Norm = team1 ? normalize(team1) : '';
        const t2Norm = team2 ? normalize(team2) : '';
        console.log('Normalized teams:', { t1Norm, t2Norm });

        // More flexible filtering
        const filteredMatches = allMatches.filter(match => {
          if (!match || typeof match !== 'object') return false;
          
          const homeNorm = normalize(match.Team_Home || '');
          const awayNorm = normalize(match.Team_Away || '');

          if (t1Norm && t2Norm) {
            return (homeNorm.includes(t1Norm) && awayNorm.includes(t2Norm)) ||
                   (homeNorm.includes(t2Norm) && awayNorm.includes(t1Norm));
          }
          
          const searchTeam = t1Norm || t2Norm;
          return homeNorm.includes(searchTeam) || awayNorm.includes(searchTeam);
        });

        console.log(`🎯 Filtered matches found: ${filteredMatches.length}`);
        
        return filteredMatches
          .sort((a, b) => safeDate(b.Date).getTime() - safeDate(a.Date).getTime())
          .slice(0, team1 && team2 ? 6 : 10);
      } catch (error) {
        console.error('Error in useHeadToHead:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    enabled: !!((team1?.trim() || team2?.trim())),
    initialData: [] // Ensure initial data is always an array
  });
};
