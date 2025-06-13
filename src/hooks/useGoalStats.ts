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

const parseTeamStatsCSV = (csvText: string): TeamStats[] => {
  if (!csvText?.trim()) {
    console.warn('CSV text is empty or undefined');
    return [];
  }

  const lines = csvText.trim().replace(/\r\n/g, '\n').split('\n');
  
  if (lines.length <= 1) {
    console.warn('No data lines found in CSV');
    return [];
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  return lines.slice(1)
    .filter(line => line.trim().length > 0)
    .map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const stats: Partial<TeamStats> = {};
      
      headers.forEach((header, headerIndex) => {
        if (headerIndex >= values.length) return;
        
        const cleanValue = values[headerIndex] || '';
        
        // Map CSV columns to TeamStats fields
        if (header === 'Team_Home' || header === 'Team_Away' || header === 'Team') {
          stats.Team = cleanValue;
        } else if (header === 'League_Name') {
          stats.League_Name = cleanValue;
        } else if (header === 'GP') {
          stats.GP = parseFloat(cleanValue) || 0;
        } else if (header === 'Avg') {
          stats.Avg = parseFloat(cleanValue) || 0;
        } else if (header.includes('+') || header === 'BTS' || header === 'CS' || header === 'FTS') {
          // Handle percentage values (0.5+, 1.5+, etc.) and other stats
          const numericValue = parseFloat(cleanValue.replace('%', '')) || 0;
          stats[header as keyof TeamStats] = numericValue;
        }
      });
      
      return stats as TeamStats;
    })
    .filter(team => {
      const teamName = team.Team?.trim();
      return teamName && teamName.length > 0 && team.GP && team.GP > 0;
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
  
  return lines.slice(1)
    .filter(line => line.trim().length > 0)
    .map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const league: Partial<LeagueAverageData> = {};
      
      headers.forEach((header, headerIndex) => {
        if (headerIndex >= values.length) return;
        
        let cleanValue = values[headerIndex] || '';
        
        if (header === 'League_Name') {
          league.League_Name = cleanValue;
        } else {
          cleanValue = cleanValue.replace('%', '');
          const numericValue = parseFloat(cleanValue) || 0;
          league[header as keyof LeagueAverageData] = numericValue;
        }
      });
      
      return league as LeagueAverageData;
    });
};

const fetchCSVData = async (url: string): Promise<string> => {
  const response = await fetch(url, {
    headers: {
      'Accept': 'text/csv',
      'Cache-Control': 'no-cache'
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT)
  });
  
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
  const fetchAndParseTeamStats = async (url: string) => {
    try {
      const csvText = await fetchCSVData(url);
      return parseTeamStatsCSV(csvText);
    } catch (error) {
      console.error(`Error processing team stats from ${url}:`, error);
      throw error;
    }
  };

  const fetchAndParseLeagueAverages = async () => {
    try {
      const csvText = await fetchCSVData(FILES.LEAGUE_AVERAGES);
      return parseLeagueAveragesCSV(csvText);
    } catch (error) {
      console.error('Error processing league averages:', error);
      throw error;
    }
  };

  const { data: homeStats = [], isLoading: homeLoading, error: homeError } = useQuery(
    useQueryConfig('homeStats', () => fetchAndParseTeamStats(FILES.HOME_STATS))
  );

  const { data: awayStats = [], isLoading: awayLoading, error: awayError } = useQuery(
    useQueryConfig('awayStats', () => fetchAndParseTeamStats(FILES.AWAY_STATS))
  );

  const { data: overallStats = [], isLoading: overallLoading, error: overallError } = useQuery(
    useQueryConfig('overallStats', () => fetchAndParseTeamStats(FILES.OVERALL_STATS))
  );

  const { data: leagueAverages = [], isLoading: leagueLoading, error: leagueError } = useQuery(
    useQueryConfig('leagueAverages', fetchAndParseLeagueAverages)
  );

  const isLoading = homeLoading || awayLoading || overallLoading || leagueLoading;
  const error = homeError || awayError || overallError || leagueError;

  const calculateLeagueAverage = (): Record<string, number> => {
    if (!overallStats.length) return { "1.5+": 0, "2.5+": 0, "3.5+": 0, "4.5+": 0 };
    
    const averages = ["1.5+", "2.5+", "3.5+", "4.5+"].reduce((acc, key) => {
      const total = overallStats.reduce((sum, team) => sum + (team[key as keyof TeamStats] as number), 0);
      acc[key] = parseFloat((total / overallStats.length).toFixed(2));
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
