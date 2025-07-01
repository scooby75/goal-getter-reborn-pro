import { useQuery } from '@tanstack/react-query';
import { TeamStats, GoalsHalfStats, ScoredFirstStats } from '@/types/goalStats';
import { fetchCSVWithRetry } from '@/utils/csvHelpers';
import { parseCSV, parseGoalsHalfCSV, parseScoredFirstCSV } from '@/utils/csvParsers';
import { useMemo } from 'react';

// ✅ URLs corrigidos para usar raw.githubusercontent.com
const CSV_URLS = {
  AWAY_STATS: 'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/Goals_Stats_Away.csv',
  GOALS_HALF: 'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/Goals_Half.csv',
  SCORED_FIRST_AWAY: 'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/scored_first_away.csv'
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
  const awayStatsQuery = useQuery({
    queryKey: ['awayStats'],
    queryFn: () => fetchCSVData(CSV_URLS.AWAY_STATS),
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const goalsHalfQuery = useQuery({
    queryKey: ['goalsHalf'],
    queryFn: fetchGoalsHalfData,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const scoredFirstAwayQuery = useQuery({
    queryKey: ['scoredFirstAway'],
    queryFn: fetchScoredFirstAwayData,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const mergedAwayStats = useMemo(() => {
    if (!awayStatsQuery.data || !goalsHalfQuery.data || !scoredFirstAwayQuery.data) {
      return [];
    }

    return awayStatsQuery.data.map(team => {
      const halfData = goalsHalfQuery.data.find(d => d.Team === team.Team);
      
      const potentialMatches = scoredFirstAwayQuery.data.filter(d => d.Team === team.Team);
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
  }, [awayStatsQuery.data, goalsHalfQuery.data, scoredFirstAwayQuery.data]);

  const isLoading = awayStatsQuery.isLoading || goalsHalfQuery.isLoading || scoredFirstAwayQuery.isLoading;
  const error = awayStatsQuery.error || goalsHalfQuery.error || scoredFirstAwayQuery.error;

  return { 
    data: mergedAwayStats, 
    isLoading, 
    error,
    refetch: () => {
      awayStatsQuery.refetch();
      goalsHalfQuery.refetch();
      scoredFirstAwayQuery.refetch();
    }
  };
};
