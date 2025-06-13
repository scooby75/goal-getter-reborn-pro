import { useQuery } from '@tanstack/react-query';
import { TeamStats, GoalStatsData, LeagueAverageData } from '@/types/goalStats';

// Constants
const STALE_TIME = 1000 * 60 * 5; // 5 minutes
const REQUEST_TIMEOUT = 30000; // 30 seconds

const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main';

const FILES = {
  HOME_STATS: `${GITHUB_BASE_URL}/Goals_Stats_Home.csv`,
  AWAY_STATS: `${GITHUB_BASE_URL}/Goals_Stats_Away.csv`,
  OVERALL_STATS: `${GITHUB_BASE_URL}/Goals_Stats_Overall.csv`,
  LEAGUE_AVERAGES: `${GITHUB_BASE_URL}/League_Averages.csv`
};

const parseCSV = (csvText: string): TeamStats[] => {
  if (!csvText?.trim()) {
    console.warn('CSV text is empty or undefined');
    return [];
  }

  // Normalize line endings and split lines
  const lines = csvText.trim().replace(/\r\n/g, '\n').split('\n');
  
  if (lines.length <= 1) {
    console.warn('No data lines found in CSV');
    return [];
  }

  // Process headers
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  return lines.slice(1)
    .map(line => {
      // Handle quoted values that might contain commas
      const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      const stats: Partial<TeamStats> = {};
      
      headers.forEach((header, headerIndex) => {
        if (headerIndex >= values.length) return;
        
        let cleanValue = values[headerIndex]?.trim().replace(/"/g, '') || '';
        
        if (header.toLowerCase() === 'team') {
          stats.Team = cleanValue;
        } else if (header === 'League_Name') {
          stats.League_Name = cleanValue;
        } else {
          // Remove any percentage signs before parsing numbers
          cleanValue = cleanValue.replace('%', '');
          const numericValue = parseFloat(cleanValue);
          stats[header as keyof TeamStats] = isNaN(numericValue) ? 0 : numericValue;
        }
      });
      
      return stats as TeamStats;
    })
    .filter(team => {
      const teamName = team.Team?.trim();
      return teamName && 
             !teamName.toLowerCase().includes('league average') &&
             !(teamName.includes(' - ') && team.GP && team.GP > 0);
    });
};

const parseLeagueAveragesCSV = (csvText: string): LeagueAverageData[] => {
  if (!csvText?.trim()) {
    console.warn('League averages CSV text is empty or undefined');
    return [];
  }

  const lines = csvText.trim().replace(/\r\n/g, '\n').split('\n');
  if (lines.length <= 1) {
    console.warn('No data lines found in league averages CSV');
    return [];
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  return lines.slice(1).map(line => {
    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    const league: Partial<LeagueAverageData> = {};
    
    headers.forEach((header, headerIndex) => {
      if (headerIndex >= values.length) return;
      
      let cleanValue = values[headerIndex]?.trim().replace(/"/g, '') || '';
      
      if (header === 'League_Name') {
        league.League_Name = cleanValue;
      } else {
        cleanValue = cleanValue.replace('%', '');
        const numericValue = parseFloat(cleanValue);
        league[header as keyof LeagueAverageData] = isNaN(numericValue) ? 0 : numericValue;
      }
    });
    
    return league as LeagueAverageData;
  });
};

const fetchCSVData = async (url: string): Promise<string> => {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  
  return await response.text();
};

const useQueryConfig = (queryKey: string, queryFn: () => Promise<any>) => ({
  queryKey: [queryKey],
  queryFn,
  staleTime: STALE_TIME,
  retry: 2
});

export const useGoalStats = () => {
  const fetchAndParse = async (url: string, parser: (data: string) => any) => {
    try {
      const csvText = await fetchCSVData(url);
      return parser(csvText);
    } catch (error) {
      console.error(`Error processing ${url}:`, error);
      throw error;
    }
  };

  const { data: homeStats = [], isLoading: homeLoading, error: homeError } = useQuery(
    useQueryConfig('homeStats', () => fetchAndParse(FILES.HOME_STATS, parseCSV))
  );

  const { data: awayStats = [], isLoading: awayLoading, error: awayError } = useQuery(
    useQueryConfig('awayStats', () => fetchAndParse(FILES.AWAY_STATS, parseCSV))
  );

  const { data: overallStats = [], isLoading: overallLoading, error: overallError } = useQuery(
    useQueryConfig('overallStats', () => fetchAndParse(FILES.OVERALL_STATS, parseCSV))
  );

  const { data: leagueAverages = [], isLoading: leagueLoading, error: leagueError } = useQuery(
    useQueryConfig('leagueAverages', () => fetchAndParse(FILES.LEAGUE_AVERAGES, parseLeagueAveragesCSV))
  );

  const isLoading = homeLoading || awayLoading || overallLoading || leagueLoading;
  const error = homeError || awayError || overallError || leagueError;

  const calculateLeagueAverage = (): Record<string, number> => {
    if (!overallStats.length) return { "1.5+": 0, "2.5+": 0, "3.5+": 0, "4.5+": 0 };
    
    const averages = ["1.5+", "2.5+", "3.5+", "4.5+"].reduce((acc, key) => {
      const total = overallStats.reduce((sum, team) => sum + (team[key as keyof TeamStats] as number), 0);
      acc[key] = Math.round((total / overallStats.length) * 100) / 100;
      return acc;
    }, {} as Record<string, number>);
    
    return averages;
  };

  const goalStatsData: GoalStatsData = {
    homeStats,
    awayStats,
    overallStats,
    leagueAverage: calculateLeagueAverage(),
    leagueAverages,
  };

  return { goalStatsData, isLoading, error };
};
