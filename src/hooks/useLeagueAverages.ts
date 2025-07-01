
import { useQuery } from '@tanstack/react-query';
import { LeagueAverageData } from '@/types/goalStats';
import { fetchCSVWithRetry } from '@/utils/csvHelpers';
import { parseLeagueAveragesCSV } from '@/utils/csvParsers';

const CSV_URL = 'https://github.com/scooby75/goal-getter-reborn-pro/blob/main/League_Averages.csv';

const fetchLeagueAveragesData = async (): Promise<LeagueAverageData[]> => {
  const csvText = await fetchCSVWithRetry(CSV_URL);
  return parseLeagueAveragesCSV(csvText);
};

export const useLeagueAverages = () => {
  return useQuery({
    queryKey: ['leagueAverages'],
    queryFn: fetchLeagueAveragesData,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
