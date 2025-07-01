
import { useQuery } from '@tanstack/react-query';
import { TeamStats, GoalsHalfStats, ScoredFirstStats } from '@/types/goalStats';
import { fetchCSVWithRetry } from '@/utils/csvHelpers';
import { parseCSV, parseGoalsHalfCSV, parseScoredFirstCSV } from '@/utils/csvParsers';
import { useMemo } from 'react';

const CSV_URLS = {
  AWAY_STATS: 'https://github.com/scooby75/goal-getter-reborn-pro/blob/main/Goals_Stats_Away.csv',
  GOALS_HALF: 'https://github.com/scooby75/goal-getter-reborn-pro/blob/main/Goals_Half.csv',
  SCORED_FIRST_AWAY: 'https://github.com/scooby75/goal-getter-reborn-pro/blob/main/scored_first_away.csv'
};

const fetchCSVData = async (url: string): Promise<TeamStats[]> => {
  const csvText = await fetchCSVWithRetry(url);
  return parseCSV(csvText);
};

const fetchGoalsHalfData = async (): Promise<GoalsHalfStats[]> => {
  const csvText = await fetchCSVWithRetry(CSV_URLS.GOALS_HALF);
  return parseGoalsHalfCSV(csvText);
};

const fetchScoredFirstAwayData = async (): Promise<ScoredFirstStats[]> => {
  const csvText = await fetchCSVWithRetry(CSV_URLS.SCORED_FIRST_AWAY);
  return parseScoredFirstCSV(csvText);
};

export const useAwayStats = () => {
  const { data: awayStats = [], isLoading: awayLoading, error: awayError } = useQuery({
    queryKey: ['awayStats'],
    queryFn: () => fetchCSVData(CSV_URLS.AWAY_STATS),
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

  const { data: scoredFirstAwayData = [], isLoading: scoredFirstAwayLoading, error: scoredFirstAwayError } = useQuery({
    queryKey: ['scoredFirstAway'],
    queryFn: fetchScoredFirstAwayData,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

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

  const isLoading = awayLoading || goalsHalfLoading || scoredFirstAwayLoading;
  const error = awayError || goalsHalfError || scoredFirstAwayError;

  return { data: mergedAwayStats, isLoading, error };
};
