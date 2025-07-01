
import { useQuery } from '@tanstack/react-query';
import { TeamStats, GoalsHalfStats, ScoredFirstStats } from '@/types/goalStats';
import { fetchCSVWithRetry } from '@/utils/csvHelpers';
import { parseCSV, parseGoalsHalfCSV, parseScoredFirstCSV } from '@/utils/csvParsers';
import { useMemo } from 'react';

const CSV_URLS = {
  HOME_STATS: 'https://github.com/scooby75/goal-getter-reborn-pro/blob/main/Goals_Stats_Home.csv',
  GOALS_HALF: 'https://github.com/scooby75/goal-getter-reborn-pro/blob/main/Goals_Half.csv',
  SCORED_FIRST_HOME: 'https://github.com/scooby75/goal-getter-reborn-pro/blob/main/scored_first_home.csv'
};

const fetchCSVData = async (url: string): Promise<TeamStats[]> => {
  const csvText = await fetchCSVWithRetry(url);
  return parseCSV(csvText);
};

const fetchGoalsHalfData = async (): Promise<GoalsHalfStats[]> => {
  const csvText = await fetchCSVWithRetry(CSV_URLS.GOALS_HALF);
  return parseGoalsHalfCSV(csvText);
};

const fetchScoredFirstHomeData = async (): Promise<ScoredFirstStats[]> => {
  const csvText = await fetchCSVWithRetry(CSV_URLS.SCORED_FIRST_HOME);
  return parseScoredFirstCSV(csvText);
};

export const useHomeStats = () => {
  const { data: homeStats = [], isLoading: homeLoading, error: homeError } = useQuery({
    queryKey: ['homeStats'],
    queryFn: () => fetchCSVData(CSV_URLS.HOME_STATS),
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

  const isLoading = homeLoading || goalsHalfLoading || scoredFirstHomeLoading;
  const error = homeError || goalsHalfError || scoredFirstHomeError;

  return { data: mergedHomeStats, isLoading, error };
};
