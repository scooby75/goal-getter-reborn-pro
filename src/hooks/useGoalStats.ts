import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TeamStats, GoalStatsData, LeagueAverageData, GoalsHalfStats, ScoredFirstStats } from '@/types/goalStats';

// Use local CSV files instead of remote GitHub URLs
const CSV_URLS = {
  HOME_STATS: '/Goals_Stats_Home.csv',
  AWAY_STATS: '/Goals_Stats_Away.csv',
  OVERALL_STATS: '/Goals_Stats_Overall.csv',
  LEAGUE_AVERAGES: '/League_Averages.csv',
  GOALS_HALF: '/Goals_Half.csv',
  SCORED_FIRST_HOME: '/scored_first_home.csv',
  SCORED_FIRST_AWAY: '/scored_first_away.csv'
};

// Helper function to add cache busting parameter
const addCacheBusting = (url: string): string => {
  const timestamp = Date.now();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_t=${timestamp}`;
};

// Generic fetch function with better error handling
const fetchCSVWithRetry = async (url: string, maxRetries = 3): Promise<string> => {
  const urlWithCacheBusting = addCacheBusting(url);
  console.log(`Fetching data from: ${urlWithCacheBusting}`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(urlWithCacheBusting, {
        method: 'GET',
        headers: {
          'Accept': 'text/csv,text/plain,*/*',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const csvText = await response.text();
      console.log(`Data fetched successfully from ${url} (attempt ${attempt})`);
      return csvText;
    } catch (error) {
      console.error(`Attempt ${attempt} failed for ${url}:`, error);
      
      if (attempt === maxRetries) {
        throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts: ${error}`);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw new Error(`Failed to fetch ${url}`);
};

const parseCSV = (csvText: string): TeamStats[] => {
  console.log('Parsing CSV data...');
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  console.log('CSV Headers:', headers);
  console.log('Total lines:', lines.length);
  
  const parsedData = lines.slice(1).map((line, index) => {
    const values = line.split(',');
    const stats: any = {};
    
    headers.forEach((header, headerIndex) => {
      const cleanHeader = header.trim().replace(/"/g, '');
      const cleanValue = values[headerIndex]?.trim().replace(/"/g, '') || '';
      
      if (cleanHeader === 'Team' || cleanHeader === 'team' || cleanHeader.toLowerCase().includes('team')) {
        stats.Team = cleanValue;
      } else if (cleanHeader === 'League_Name') {
        stats.League_Name = cleanValue;
      } else {
        stats[cleanHeader] = parseFloat(cleanValue) || 0;
      }
    });
    
    return stats as TeamStats;
  }).filter(team => {
    // Filter out invalid entries
    const teamName = team.Team;
    
    // Remove entries with empty team names
    if (!teamName || teamName.trim() === '') {
      return false;
    }
    
    // Remove "League average" entries
    if (teamName.toLowerCase().includes('league average')) {
      return false;
    }
    
    // Remove league header entries (lines that only contain league name)
    if (teamName.includes(' - ') && (!team.GP || team.GP === 0)) {
      return false;
    }
    
    return true;
  });

  console.log('Parsed and filtered data count:', parsedData.length);
  console.log('Sample teams:', parsedData.slice(0, 10).map(team => `${team.Team} (${team.League_Name})`));
  
  return parsedData;
};

const parseLeagueAveragesCSV = (csvText: string): LeagueAverageData[] => {
  console.log('Parsing League Averages CSV data...');
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  console.log('League CSV Headers:', headers);
  console.log('Total league lines:', lines.length);
  
  const parsedData = lines.slice(1).map((line) => {
    const values = line.split(',');
    const league: any = {};
    
    headers.forEach((header, headerIndex) => {
      const cleanHeader = header.trim().replace(/"/g, '');
      let cleanValue = values[headerIndex]?.trim().replace(/"/g, '') || '';
      
      if (cleanHeader === 'League_Name') {
        league.League_Name = cleanValue;
      } else {
        // Remove % sign and convert to number
        if (cleanValue.includes('%')) {
          cleanValue = cleanValue.replace('%', '');
        }
        league[cleanHeader] = parseFloat(cleanValue) || 0;
      }
    });
    
    return league as LeagueAverageData;
  });

  console.log('Parsed league averages count:', parsedData.length);
  console.log('Sample leagues:', parsedData.slice(0, 5).map(league => league.League_Name));
  
  return parsedData;
};

const parseGoalsHalfCSV = (csvText: string): GoalsHalfStats[] => {
  console.log('Parsing Goals Half CSV data...');
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  const parsedData = lines.slice(1).map((line) => {
    const values = line.split(',');
    const stats: any = {};
    
    headers.forEach((header, headerIndex) => {
      const cleanHeader = header.trim().replace(/"/g, '');
      let cleanValue = values[headerIndex]?.trim().replace(/"/g, '') || '';
      
      if (cleanHeader === 'Team') {
        stats.Team = cleanValue;
      } else {
        if (cleanValue.includes('%')) {
          cleanValue = cleanValue.replace('%', '');
        }
        stats[cleanHeader] = parseFloat(cleanValue) || 0;
      }
    });
    
    return stats as GoalsHalfStats;
  }).filter(s => s.Team && s.Team.trim() !== '');

  console.log('Parsed goals half stats count:', parsedData.length);
  return parsedData;
};

const parseScoredFirstCSV = (csvText: string): ScoredFirstStats[] => {
  console.log('Parsing Scored First CSV data...');
  if (!csvText || csvText.trim() === '') {
    console.warn('Scored First CSV text is empty or invalid.');
    return [];
  }
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    console.warn('Scored First CSV has no data rows.');
    return [];
  }

  // Detect separator by checking for tabs in header
  const separator = lines[0].includes('\t') ? '\t' : ',';

  const headers = lines[0].split(separator).map(h => h.trim().replace(/"/g, ''));
  console.log('Scored First CSV Headers:', headers);
  
  // Find team header ('Team_Home', 'Team_Away', or 'Team')
  const teamHeader = headers.find(h => h.toLowerCase().startsWith('team'));
  if (!teamHeader) {
    console.error('Team column not found in scored first CSV');
    return [];
  }
  console.log('Using team header:', teamHeader);

  const parsedData = lines.slice(1).map((line) => {
    const values = line.split(separator);
    const stats: any = {};
    
    headers.forEach((header, headerIndex) => {
      const cleanHeader = header.trim().replace(/"/g, '');
      let cleanValue = values[headerIndex]?.trim().replace(/"/g, '') || '';
      
      if (cleanHeader === teamHeader) {
        stats.Team = cleanValue;
      } else if (cleanHeader.toLowerCase() === 'league') {
        stats.League = cleanValue;
      }
      else {
        if (cleanValue.includes('%')) {
          cleanValue = cleanValue.replace('%', '');
        }
        stats[cleanHeader] = parseFloat(cleanValue) || 0;
      }
    });
    
    return stats as ScoredFirstStats;
  }).filter(s => s.Team && s.Team.trim() !== '' && s['Perc.'] !== undefined);

  console.log(`Parsed scored first stats count: ${parsedData.length}`);
  if(parsedData.length > 0) {
    console.log('Sample of parsed scored first data:', parsedData.slice(0, 5));
  }
  return parsedData;
};

const fetchCSVData = async (url: string): Promise<TeamStats[]> => {
  const csvText = await fetchCSVWithRetry(url);
  return parseCSV(csvText);
};

const fetchLeagueAveragesData = async (): Promise<LeagueAverageData[]> => {
  const csvText = await fetchCSVWithRetry(CSV_URLS.LEAGUE_AVERAGES);
  return parseLeagueAveragesCSV(csvText);
};

const fetchGoalsHalfData = async (): Promise<GoalsHalfStats[]> => {
  const csvText = await fetchCSVWithRetry(CSV_URLS.GOALS_HALF);
  return parseGoalsHalfCSV(csvText);
};

const fetchScoredFirstHomeData = async (): Promise<ScoredFirstStats[]> => {
  const csvText = await fetchCSVWithRetry(CSV_URLS.SCORED_FIRST_HOME);
  return parseScoredFirstCSV(csvText);
};

const fetchScoredFirstAwayData = async (): Promise<ScoredFirstStats[]> => {
  const csvText = await fetchCSVWithRetry(CSV_URLS.SCORED_FIRST_AWAY);
  return parseScoredFirstCSV(csvText);
};

export const useGoalStats = () => {
  console.log('useGoalStats hook called');

  const { data: homeStats = [], isLoading: homeLoading, error: homeError } = useQuery({
    queryKey: ['homeStats'],
    queryFn: () => fetchCSVData(CSV_URLS.HOME_STATS),
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: awayStats = [], isLoading: awayLoading, error: awayError } = useQuery({
    queryKey: ['awayStats'],
    queryFn: () => fetchCSVData(CSV_URLS.AWAY_STATS),
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: overallStats = [], isLoading: overallLoading, error: overallError } = useQuery({
    queryKey: ['overallStats'],
    queryFn: () => fetchCSVData(CSV_URLS.OVERALL_STATS),
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: leagueAverages = [], isLoading: leagueLoading, error: leagueError } = useQuery({
    queryKey: ['leagueAverages'],
    queryFn: fetchLeagueAveragesData,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: goalsHalfData = [], isLoading: goalsHalfLoading, error: goalsHalfError } = useQuery({
    queryKey: ['goalsHalf'],
    queryFn: fetchGoalsHalfData,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: scoredFirstHomeData = [], isLoading: scoredFirstHomeLoading, error: scoredFirstHomeError } = useQuery({
    queryKey: ['scoredFirstHome'],
    queryFn: fetchScoredFirstHomeData,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: scoredFirstAwayData = [], isLoading: scoredFirstAwayLoading, error: scoredFirstAwayError } = useQuery({
    queryKey: ['scoredFirstAway'],
    queryFn: fetchScoredFirstAwayData,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const isLoading = homeLoading || awayLoading || overallLoading || leagueLoading || goalsHalfLoading || scoredFirstHomeLoading || scoredFirstAwayLoading;
  const error = homeError || awayError || overallError || leagueError || goalsHalfError || scoredFirstHomeError || scoredFirstAwayError;

  // Enhanced debugging
  console.log('Data loading status:', {
    homeStats: homeStats.length,
    awayStats: awayStats.length,
    overallStats: overallStats.length,
    leagueAverages: leagueAverages.length,
    goalsHalfData: goalsHalfData.length,
    scoredFirstHomeData: scoredFirstHomeData.length,
    scoredFirstAwayData: scoredFirstAwayData.length,
    isLoading,
    error: error?.message
  });

  const calculateLeagueAverage = () => {
    if (overallStats.length === 0) return { "1.5+": 0, "2.5+": 0, "3.5+": 0, "4.5+": 0 };
    
    const total15 = overallStats.reduce((sum, team) => sum + team["1.5+"], 0);
    const total25 = overallStats.reduce((sum, team) => sum + team["2.5+"], 0);
    const total35 = overallStats.reduce((sum, team) => sum + team["3.5+"], 0);
    const total45 = overallStats.reduce((sum, team) => sum + team["4.5+"], 0);
    
    return {
      "1.5+": Math.round((total15 / overallStats.length) * 100) / 100,
      "2.5+": Math.round((total25 / overallStats.length) * 100) / 100,
      "3.5+": Math.round((total35 / overallStats.length) * 100) / 100,
      "4.5+": Math.round((total45 / overallStats.length) * 100) / 100,
    };
  };

  const mergedHomeStats = useMemo(() => {
    return homeStats.map(team => {
      const halfData = goalsHalfData.find(d => d.Team === team.Team);
      
      const potentialMatches = scoredFirstHomeData.filter(d => d.Team === team.Team);
      let scoredFirstData: ScoredFirstStats | undefined;

      if (potentialMatches.length === 1) {
        scoredFirstData = potentialMatches[0];
      } else if (potentialMatches.length > 1) {
        scoredFirstData = potentialMatches.find(d => 
          d.League && team.League_Name && team.League_Name.toLowerCase().includes(d.League.toLowerCase())
        );
      }
      
      const newStats: Partial<TeamStats> = {};
      if (halfData) {
        newStats['1st half'] = halfData['1st half'];
        newStats['2nd half'] = halfData['2nd half'];
        newStats['Avg. minute'] = halfData['Avg. minute'];
      }
      if (scoredFirstData) {
        newStats.scoredFirstPerc = scoredFirstData['Perc.'];
      }
      return { ...team, ...newStats };
    });
  }, [homeStats, goalsHalfData, scoredFirstHomeData]);

  const mergedAwayStats = useMemo(() => {
    return awayStats.map(team => {
      const halfData = goalsHalfData.find(d => d.Team === team.Team);
      
      const potentialMatches = scoredFirstAwayData.filter(d => d.Team === team.Team);
      let scoredFirstData: ScoredFirstStats | undefined;

      if (potentialMatches.length === 1) {
        scoredFirstData = potentialMatches[0];
      } else if (potentialMatches.length > 1) {
        scoredFirstData = potentialMatches.find(d => 
          d.League && team.League_Name && team.League_Name.toLowerCase().includes(d.League.toLowerCase())
        );
      }
      
      const newStats: Partial<TeamStats> = {};
      if (halfData) {
        newStats['1st half'] = halfData['1st half'];
        newStats['2nd half'] = halfData['2nd half'];
        newStats['Avg. minute'] = halfData['Avg. minute'];
      }
      if (scoredFirstData) {
        newStats.scoredFirstPerc = scoredFirstData['Perc.'];
      }
      return { ...team, ...newStats };
    });
  }, [awayStats, goalsHalfData, scoredFirstAwayData]);

  const goalStatsData: GoalStatsData = {
    homeStats: mergedHomeStats,
    awayStats: mergedAwayStats,
    overallStats,
    leagueAverage: calculateLeagueAverage(),
    leagueAverages,
  };

  console.log('Final goal stats data:', { 
    isLoading, 
    error: error?.message, 
    homeCount: mergedHomeStats.length,
    awayCount: mergedAwayStats.length,
    overallCount: overallStats.length,
    leagueAveragesCount: leagueAverages.length
  });

  return { goalStatsData, isLoading, error };
};
