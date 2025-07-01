import { useQuery } from '@tanstack/react-query';
import { LeagueAverageData } from '@/types/goalStats';
import { fetchCSVWithRetry } from '@/utils/csvHelpers';
import { parseLeagueAveragesCSV } from '@/utils/csvParsers';

// ✅ URL corrigido para usar raw.githubusercontent.com
const CSV_URL = 'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/League_Averages.csv';

// Configurações padrão para a query
const DEFAULT_QUERY_CONFIG = {
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  staleTime: 5 * 60 * 1000, // 5 minutos
  gcTime: 10 * 60 * 1000, // 10 minutos
};

const fetchLeagueAveragesData = async (): Promise<LeagueAverageData[]> => {
  try {
    const csvText = await fetchCSVWithRetry(CSV_URL);
    return parseLeagueAveragesCSV(csvText);
  } catch (error) {
    console.error('Failed to fetch league averages:', error);
    throw new Error(`Failed to load league averages data: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const useLeagueAverages = () => {
  const query = useQuery<LeagueAverageData[], Error>({
    queryKey: ['leagueAverages'],
    queryFn: fetchLeagueAveragesData,
    ...DEFAULT_QUERY_CONFIG,
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
};
