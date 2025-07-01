import { useQuery } from '@tanstack/react-query';
import { LeagueAverageData } from '@/types/goalStats';
import { parseLeagueAveragesCSV } from '@/utils/csvParsers';

const QUERY_CONFIG = {
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
  staleTime: 24 * 60 * 60 * 1000,
  gcTime: 48 * 60 * 60 * 1000,
} as const;

const fetchLeagueData = async (): Promise<LeagueAverageData[]> => {
  try {
    const CSV_URL = process.env.NODE_ENV === 'development'
      ? '/data/League_Averages.csv'
      : 'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/League_Averages.csv';

    const response = await fetch(CSV_URL, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csvText = await response.text();

    if (!csvText.trim()) {
      throw new Error('O arquivo CSV está vazio');
    }

    const parsedData = parseLeagueAveragesCSV(csvText);

    // CORREÇÃO: Parêntese faltando na condição
    if (!Array.isArray(parsedData)) {
      throw new Error('Os dados parseados não estão no formato esperado');
    }

    if (parsedData.length === 0) {
      console.warn('O arquivo CSV foi carregado mas está vazio');
    }

    return parsedData;
  } catch (error) {
    console.error('Erro ao carregar médias da liga:', {
      error: error instanceof Error ? error.message : error,
      timestamp: new Date().toISOString()
    });
    throw new Error('Não foi possível carregar as médias da liga');
  }
};

export const useLeagueAverages = () => {
  const query = useQuery<LeagueAverageData[], Error>({
    queryKey: ['leagueAverages'],
    queryFn: fetchLeagueData,
    ...QUERY_CONFIG
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
};
