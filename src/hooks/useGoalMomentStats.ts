import { useQuery } from '@tanstack/react-query';
import { GoalMomentStats } from '@/types/goalStats';
import { fetchCSVWithRetry } from '@/utils/csvHelpers';
import { parseGoalMomentCSV } from '@/utils/csvParsers';

// ✅ URLs corrigidos para usar raw.githubusercontent.com
const CSV_URLS = {
  HOME_GOAL_MOMENTS: 'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/momento_do_gol_home.csv',
  AWAY_GOAL_MOMENTS: 'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/momento_do_gol_away.csv'
};

const fetchGoalMomentData = async (url: string): Promise<GoalMomentStats[]> => {
  const csvText = await fetchCSVWithRetry(url);
  return parseGoalMomentCSV(csvText);
};

export const useGoalMomentStats = () => {
  const homeQuery = useQuery<GoalMomentStats[], Error>({
    queryKey: ['homeGoalMoments'],
    queryFn: () => fetchGoalMomentData(CSV_URLS.HOME_GOAL_MOMENTS),
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  const awayQuery = useQuery<GoalMomentStats[], Error>({
    queryKey: ['awayGoalMoments'],
    queryFn: () => fetchGoalMomentData(CSV_URLS.AWAY_GOAL_MOMENTS),
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Combina os dados e estados de loading/error
  return {
    homeGoalMoments: homeQuery.data || [],
    awayGoalMoments: awayQuery.data || [],
    isLoading: homeQuery.isLoading || awayQuery.isLoading,
    isFetching: homeQuery.isFetching || awayQuery.isFetching,
    error: homeQuery.error || awayQuery.error,
    refetch: () => {
      homeQuery.refetch();
      awayQuery.refetch();
    }
  };
};
