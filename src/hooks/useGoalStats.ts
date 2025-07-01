import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TeamStats, GoalStatsData, LeagueAverageData, GoalsHalfStats, ScoredFirstStats } from '@/types/goalStats';

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

// Helper function to add cache busting parameter
const addCacheBusting = (url: string): string => {
  const timestamp = Date.now();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_t=${timestamp}`;
};

const fetchCSVData = async (url: string): Promise<TeamStats[]> => {
  const urlWithCacheBusting = addCacheBusting(url);
  console.log(`Fetching data from: ${urlWithCacheBusting}`);
  try {
    const response = await fetch(urlWithCacheBusting, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch data from ${url}: ${response.status}`);
    }
    const csvText = await response.text();
    console.log(`Data fetched successfully from ${url}`);
    return parseCSV(csvText);
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    throw error;
  }
};

const fetchLeagueAveragesData = async (): Promise<LeagueAverageData[]> => {
  const url = 'https://raw.githubusercontent.com/scooby75/goal-stats-selector-pro/refs/heads/main/League_Averages.csv';
  const urlWithCacheBusting = addCacheBusting(url);
  console.log(`Fetching league averages from: ${urlWithCacheBusting}`);
  try {
    const response = await fetch(urlWithCacheBusting, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch league averages: ${response.status}`);
    }
    const csvText = await response.text();
    console.log('League averages data fetched successfully');
    return parseLeagueAveragesCSV(csvText);
  } catch (error) {
    console.error('Error fetching league averages:', error);
    throw error;
  }
};

const fetchGoalsHalfData = async (): Promise<GoalsHalfStats[]> => {
  const url = 'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/refs/heads/main/Goals_Half.csv';
  const urlWithCacheBusting = addCacheBusting(url);
  console.log(`Fetching goals half data from: ${urlWithCacheBusting}`);
  try {
    const response = await fetch(urlWithCacheBusting, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch data from ${url}: ${response.status}`);
    }
    const csvText = await response.text();
    console.log(`Data fetched successfully from ${url}`);
    return parseGoalsHalfCSV(csvText);
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    throw error;
  }
};

const fetchScoredFirstHomeData = async (): Promise<ScoredFirstStats[]> => {
  const url = 'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/refs/heads/main/scored_first_home.csv';
  const urlWithCacheBusting = addCacheBusting(url);
  console.log(`Fetching scored first home data from: ${urlWithCacheBusting}`);
  try {
    const response = await fetch(urlWithCacheBusting, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    if (!response.ok) {
      console.error(`Failed to fetch scored first home data: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch data from ${url}: ${response.status}`);
    }
    const csvText = await response.text();
    console.log(`Data fetched successfully from ${url}, length: ${csvText.length}`);
    return parseScoredFirstCSV(csvText);
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    throw error;
  }
};

const fetchScoredFirstAwayData = async (): Promise<ScoredFirstStats[]> => {
  const url = 'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/refs/heads/main/scored_first_away.csv';
  const urlWithCacheBusting = addCacheBusting(url);
  console.log(`Fetching scored first away data from: ${urlWithCacheBusting}`);
  try {
    const response = await fetch(urlWithCacheBusting, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    if (!response.ok) {
      console.error(`Failed to fetch scored first away data: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch data from ${url}: ${response.status}`);
    }
    const csvText = await response.text();
    console.log(`Data fetched successfully from ${url}, length: ${csvText.length}`);
    return parseScoredFirstCSV(csvText);
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    throw error;
  }
};

export const useGoalStats = () => {
  console.log('useGoalStats hook called');

  const { data: homeStats = [], isLoading: homeLoading, error: homeError } = useQuery({
    queryKey: ['homeStats', Date.now()], // Include timestamp in query key for cache busting
    queryFn: () => fetchCSVData('https://raw.githubusercontent.com/scooby75/goal-stats-selector-pro/refs/heads/main/Goals_Stats_Home.csv'),
    retry: 3,
    retryDelay: 1000,
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache data
  });

  const { data: awayStats = [], isLoading: awayLoading, error: awayError } = useQuery({
    queryKey: ['awayStats', Date.now()],
    queryFn: () => fetchCSVData('https://raw.githubusercontent.com/scooby75/goal-stats-selector-pro/refs/heads/main/Goals_Stats_Away.csv'),
    retry: 3,
    retryDelay: 1000,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: overallStats = [], isLoading: overallLoading, error: overallError } = useQuery({
    queryKey: ['overallStats', Date.now()],
    queryFn: () => fetchCSVData('https://raw.githubusercontent.com/scooby75/goal-stats-selector-pro/refs/heads/main/Goals_Stats_Overall.csv'),
    retry: 3,
    retryDelay: 1000,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: leagueAverages = [], isLoading: leagueLoading, error: leagueError } = useQuery({
    queryKey: ['leagueAverages', Date.now()],
    queryFn: fetchLeagueAveragesData,
    retry: 3,
    retryDelay: 1000,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: goalsHalfData = [], isLoading: goalsHalfLoading, error: goalsHalfError } = useQuery({
    queryKey: ['goalsHalf', Date.now()],
    queryFn: fetchGoalsHalfData,
    retry: 3,
    retryDelay: 1000,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: scoredFirstHomeData = [], isLoading: scoredFirstHomeLoading, error: scoredFirstHomeError } = useQuery({
    queryKey: ['scoredFirstHome', Date.now()],
    queryFn: fetchScoredFirstHomeData,
    retry: 3,
    retryDelay: 1000,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: scoredFirstAwayData = [], isLoading: scoredFirstAwayLoading, error: scoredFirstAwayError } = useQuery({
    queryKey: ['scoredFirstAway', Date.now()],
    queryFn: fetchScoredFirstAwayData,
    retry: 3,
    retryDelay: 1000,
    staleTime: 0,
    gcTime: 0,
  });

  const isLoading = homeLoading || awayLoading || overallLoading || leagueLoading || goalsHalfLoading || scoredFirstHomeLoading || scoredFirstAwayLoading;
  const error = homeError || awayError || overallError || leagueError || goalsHalfError || scoredFirstHomeError || scoredFirstAwayError;

  // Enhanced debugging
  console.log('Raw home stats count:', homeStats.length);
  console.log('Raw away stats count:', awayStats.length);
  console.log('Raw league averages count:', leagueAverages.length);
  console.log('Raw goals half data count:', goalsHalfData.length);
  console.log('Raw scored first home data count:', scoredFirstHomeData.length);
  console.log('Raw scored first away data count:', scoredFirstAwayData.length);

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
