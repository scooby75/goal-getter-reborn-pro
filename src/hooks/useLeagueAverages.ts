import { useQuery } from '@tanstack/react-query';
import { LeagueAverageData } from '@/types/goalStats';
import { fetchCSVWithRetry } from '@/utils/csvHelpers';
import { parseLeagueAveragesCSV } from '@/utils/csvParsers';

// 1. URL corrigido para formato raw
const CSV_URL = 'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/League_Averages.csv';

// 2. Adicione esta função para tratamento de erros robusto
const enhancedFetchCSVWithRetry = async (url: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.text();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

const fetchLeagueAveragesData = async (): Promise<LeagueAverageData[]> => {
  try {
    // 3. Use a função melhorada de fetch
    const csvText = await enhancedFetchCSVWithRetry(CSV_URL);
    return parseLeagueAveragesCSV(csvText);
  } catch (error) {
    console.error('Parsing error:', error);
    throw new Error('Failed to process league averages data');
  }
};

export const useLeagueAverages = () => {
  return useQuery<LeagueAverageData[], Error>({
    queryKey: ['leagueAverages'],
    queryFn: fetchLeagueAveragesData,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: Infinity, // 4. Dados não mudam frequentemente
    onError: (error) => {
      console.error('Query error:', error);
    }
  });
};
