
import { useQuery } from '@tanstack/react-query';
import { GoalMomentStats } from '@/types/goalStats';
import { fetchCSVWithRetry } from '@/utils/csvHelpers';
import { parseGoalMomentCSV } from '@/utils/csvParsers';

const CSV_URLS = {
  HOME_GOAL_MOMENTS: 'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/refs/heads/main/momento_do_gol_home.csv?token=GHSAT0AAAAAADFRERW34U7SQLMV6RER3EZC2DEMXNA',
  AWAY_GOAL_MOMENTS: 'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/refs/heads/main/momento_do_gol_away.csv?token=GHSAT0AAAAAADFRERW2TPP2D4DUAQZEA7LE2DEMYCQ'
};

const fetchGoalMomentData = async (url: string): Promise<GoalMomentStats[]> => {
  const csvText = await fetchCSVWithRetry(url);
  return parseGoalMomentCSV(csvText);
};

export const useGoalMomentStats = () => {
  const { data: homeGoalMoments = [], isLoading: homeLoading, error: homeError } = useQuery({
    queryKey: ['homeGoalMoments'],
    queryFn: () => fetchGoalMomentData(CSV_URLS.HOME_GOAL_MOMENTS),
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: awayGoalMoments = [], isLoading: awayLoading, error: awayError } = useQuery({
    queryKey: ['awayGoalMoments'],
    queryFn: () => fetchGoalMomentData(CSV_URLS.AWAY_GOAL_MOMENTS),
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const isLoading = homeLoading || awayLoading;
  const error = homeError || awayError;

  return { homeGoalMoments, awayGoalMoments, isLoading, error };
};
