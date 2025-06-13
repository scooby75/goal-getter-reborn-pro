import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TeamStats, GoalStatsData, LeagueAverageData } from '@/types/goalStats';

// Constantes para configuração
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY = 1000;
const MAX_RETRY_DELAY = 10000;
const STALE_TIME = 1000 * 60 * 5; // 5 minutos
const REQUEST_TIMEOUT = 30000; // 30 segundos

interface FetchOptions {
  headers: Record<string, string>;
  signal: AbortSignal;
}

const DEFAULT_FETCH_OPTIONS: FetchOptions = {
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Accept': 'text/csv,text/plain,*/*',
    'User-Agent': 'Goal-Stats-App/1.0'
  },
  signal: AbortSignal.timeout(REQUEST_TIMEOUT)
};

const parseCSV = (csvText: string): TeamStats[] => {
  if (!csvText?.trim()) {
    console.warn('CSV text is empty or undefined');
    return [];
  }

  const lines = csvText.trim().split('\n');
  if (lines.length <= 1) {
    console.warn('No data lines found in CSV');
    return [];
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  return lines.slice(1)
    .map(line => {
      const values = line.split(',');
      const stats: Partial<TeamStats> = {};
      
      headers.forEach((header, headerIndex) => {
        const cleanValue = values[headerIndex]?.trim().replace(/"/g, '') || '';
        
        if (header.toLowerCase() === 'team') {
          stats.Team = cleanValue;
        } else if (header === 'League_Name') {
          stats.League_Name = cleanValue;
        } else {
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
             !(teamName.includes(' - ') && (!team.GP || team.GP === 0));
    });
};

const parseLeagueAveragesCSV = (csvText: string): LeagueAverageData[] => {
  if (!csvText?.trim()) {
    console.warn('League averages CSV text is empty or undefined');
    return [];
  }

  const lines = csvText.trim().split('\n');
  if (lines.length <= 1) {
    console.warn('No data lines found in league averages CSV');
    return [];
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const league: Partial<LeagueAverageData> = {};
    
    headers.forEach((header, headerIndex) => {
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

const fetchCSVData = async (url: string): Promise<TeamStats[]> => {
  try {
    const response = await fetch(url, DEFAULT_FETCH_OPTIONS);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP Error ${response.status}: ${response.statusText}`, errorText);
      
      const errorMessages: Record<number, string> = {
        404: `File not found: ${url}. Please check if the repository and file exist.`,
        403: `Access forbidden: ${url}. The repository might be private.`,
        429: `Rate limit exceeded. Please wait before trying again.`
      };
      
      throw new Error(errorMessages[response.status] || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    
    if (!csvText.trim()) {
      throw new Error(`Empty response from ${url}`);
    }
    
    if (!csvText.includes(',') && !csvText.includes('\n')) {
      console.warn('Response does not appear to be CSV format:', csvText.substring(0, 200));
      throw new Error(`Invalid CSV format received from ${url}`);
    }
    
    return parseCSV(csvText);
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network connectivity issue. Please check your internet connection and try again.');
    } else if (error.name === 'AbortError') {
      throw new Error('Request timeout. The server might be temporarily unavailable.');
    }
    
    throw error;
  }
};

const fetchLeagueAveragesData = async (): Promise<LeagueAverageData[]> => {
  const possibleUrls = [
    'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/refs/heads/main/League_Averages.csv'    
  ];
  
  for (const url of possibleUrls) {
    try {
      const response = await fetch(url, DEFAULT_FETCH_OPTIONS);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const csvText = await response.text();
      
      if (!csvText.trim()) {
        throw new Error('Empty league averages response');
      }
      
      return parseLeagueAveragesCSV(csvText);
    } catch (error) {
      console.warn(`Failed to fetch from ${url}:`, error);
      if (url === possibleUrls[possibleUrls.length - 1]) {
        throw error;
      }
    }
  }
  
  throw new Error('Failed to fetch league averages from all sources');
};

const fetchWithFallback = async (urls: string[]): Promise<TeamStats[]> => {
  for (const url of urls) {
    try {
      return await fetchCSVData(url);
    } catch (error) {
      console.warn(`Failed to fetch from ${url}:`, error);
      if (url === urls[urls.length - 1]) {
        throw error;
      }
    }
  }
  
  throw new Error('Failed to fetch from all URLs');
};

const useQueryConfig = (queryKey: string, queryFn: () => Promise<any>) => ({
  queryKey: [queryKey],
  queryFn,
  retry: (failureCount: number, error: Error) => {
    console.log(`Retry attempt ${failureCount + 1} for ${queryKey}:`, error?.message);
    return failureCount < MAX_RETRIES;
  },
  retryDelay: (attemptIndex: number) => {
    const delay = Math.min(RETRY_BASE_DELAY * 2 ** attemptIndex, MAX_RETRY_DELAY);
    console.log(`Retry delay for ${queryKey}: ${delay}ms`);
    return delay;
  },
  staleTime: STALE_TIME
});

export const useGoalStats = () => {
  const urls = {
    homeStats: [
      'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/refs/heads/main/Goals_Stats_Home.csv'
    ],
    awayStats: [
      'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/refs/heads/main/Goals_Stats_Away.csv'
    ],
    overallStats: [
      'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/refs/heads/main/Goals_Stats_Overall.csv'
    ]
  };

  const { data: homeStats = [], isLoading: homeLoading, error: homeError } = useQuery(
    useQueryConfig('homeStats', () => fetchWithFallback(urls.homeStats))
  );

  const { data: awayStats = [], isLoading: awayLoading, error: awayError } = useQuery(
    useQueryConfig('awayStats', () => fetchWithFallback(urls.awayStats))
  );

  const { data: overallStats = [], isLoading: overallLoading, error: overallError } = useQuery(
    useQueryConfig('overallStats', () => fetchWithFallback(urls.overallStats))
  );

  const { data: leagueAverages = [], isLoading: leagueLoading, error: leagueError } = useQuery(
    useQueryConfig('leagueAverages', fetchLeagueAveragesData)
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
