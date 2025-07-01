import { useQuery } from '@tanstack/react-query';
import { TeamStats } from '@/types/goalStats';
import { fetchCSVWithRetry } from '@/utils/csvHelpers';
import { parseCSV } from '@/utils/csvParsers';

// ✅ Use o link "raw" do GitHub
const CSV_URL = 'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/Goals_Stats_Overall.csv';

const fetchCSVData = async (url: string): Promise<TeamStats[]> => {
  const csvText = await fetchCSVWithRetry(url);
  return parseCSV(csvText);
};

export const useOverallStats = () => {
  return useQuery({
    queryKey: ['overallStats'],
    queryFn: () => fetchCSVData(CSV_URL),
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
