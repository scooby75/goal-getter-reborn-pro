
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TeamStats, GoalStatsData, LeagueAverageData } from '@/types/goalStats';

const parseCSV = (csvText: string): TeamStats[] => {
  console.log('Parsing CSV data...');
  if (!csvText || csvText.trim() === '') {
    console.warn('CSV text is empty or undefined');
    return [];
  }

  const lines = csvText.trim().split('\n');
  if (lines.length === 0) {
    console.warn('No lines found in CSV');
    return [];
  }

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
  if (!csvText || csvText.trim() === '') {
    console.warn('League averages CSV text is empty or undefined');
    return [];
  }

  const lines = csvText.trim().split('\n');
  if (lines.length === 0) {
    console.warn('No lines found in league averages CSV');
    return [];
  }

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

const fetchCSVData = async (url: string): Promise<TeamStats[]> => {
  console.log(`Fetching data from: ${url}`);
  try {
    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data from ${url}: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    console.log(`Data fetched successfully from ${url}, length: ${csvText.length} characters`);
    
    if (!csvText || csvText.trim() === '') {
      throw new Error(`Empty response from ${url}`);
    }
    
    return parseCSV(csvText);
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    throw error;
  }
};

const fetchLeagueAveragesData = async (): Promise<LeagueAverageData[]> => {
  const url = 'https://raw.githubusercontent.com/scooby75/goal-stats-selector-pro/refs/heads/main/League_Averages.csv';
  console.log(`Fetching league averages from: ${url}`);
  try {
    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch league averages: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    console.log(`League averages data fetched successfully, length: ${csvText.length} characters`);
    
    if (!csvText || csvText.trim() === '') {
      throw new Error('Empty league averages response');
    }
    
    return parseLeagueAveragesCSV(csvText);
  } catch (error) {
    console.error('Error fetching league averages:', error);
    throw error;
  }
};

export const useGoalStats = () => {
  console.log('useGoalStats hook called');

  const { data: homeStats = [], isLoading: homeLoading, error: homeError } = useQuery({
    queryKey: ['homeStats'],
    queryFn: () => fetchCSVData('https://raw.githubusercontent.com/scooby75/goal-stats-selector-pro/refs/heads/main/Goals_Stats_Home.csv'),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: awayStats = [], isLoading: awayLoading, error: awayError } = useQuery({
    queryKey: ['awayStats'],
    queryFn: () => fetchCSVData('https://raw.githubusercontent.com/scooby75/goal-stats-selector-pro/refs/heads/main/Goals_Stats_Away.csv'),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: overallStats = [], isLoading: overallLoading, error: overallError } = useQuery({
    queryKey: ['overallStats'],
    queryFn: () => fetchCSVData('https://raw.githubusercontent.com/scooby75/goal-stats-selector-pro/refs/heads/main/Goals_Stats_Overall.csv'),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: leagueAverages = [], isLoading: leagueLoading, error: leagueError } = useQuery({
    queryKey: ['leagueAverages'],
    queryFn: fetchLeagueAveragesData,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const isLoading = homeLoading || awayLoading || overallLoading || leagueLoading;
  const error = homeError || awayError || overallError || leagueError;

  // Enhanced debugging
  console.log('Hook state:', {
    homeLoading,
    awayLoading,
    overallLoading,
    leagueLoading,
    homeError: homeError?.message,
    awayError: awayError?.message,
    overallError: overallError?.message,
    leagueError: leagueError?.message
  });

  console.log('Raw data counts:', {
    homeStats: homeStats.length,
    awayStats: awayStats.length,
    overallStats: overallStats.length,
    leagueAverages: leagueAverages.length
  });

  console.log('Valid teams:', {
    homeTeams: homeStats.filter(team => team.Team && team.Team.trim() !== '').length,
    awayTeams: awayStats.filter(team => team.Team && team.Team.trim() !== '').length
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

  const goalStatsData: GoalStatsData = {
    homeStats,
    awayStats,
    overallStats,
    leagueAverage: calculateLeagueAverage(),
    leagueAverages,
  };

  console.log('Final goal stats data:', { 
    isLoading, 
    error: error?.message, 
    homeCount: homeStats.length,
    awayCount: awayStats.length,
    overallCount: overallStats.length,
    leagueAveragesCount: leagueAverages.length,
    hasValidData: homeStats.length > 0 && awayStats.length > 0
  });

  return { goalStatsData, isLoading, error };
};
