
import { useQuery } from '@tanstack/react-query';
import Papa from 'papaparse';

export interface LeagueTableData {
  Team: string;
  ranking: number;
  GD: number;
  League?: string;
}

const QUERY_CONFIG = {
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
  staleTime: 10 * 60 * 1000,
  gcTime: 20 * 60 * 1000,
} as const;

const fetchTableData = async (url: string): Promise<LeagueTableData[]> => {
  try {
    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csvText = await response.text();
    
    const result = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (!result.data) {
      throw new Error('Falha ao processar CSV');
    }

    return result.data.map((row: any) => ({
      Team: row.Team || '',
      ranking: parseInt(row.ranking) || 0,
      GD: parseInt(row.GD) || 0,
      League: row.League || ''
    })).filter(item => item.Team);
  } catch (error) {
    console.error(`Erro ao carregar tabela de ${url}:`, error);
    throw new Error(`Falha ao carregar dados da tabela`);
  }
};

export const useLeagueTables = () => {
  const homeQuery = useQuery<LeagueTableData[], Error>({
    queryKey: ['leagueTableHome'],
    queryFn: () => fetchTableData('/Data/tabela_ligas_home.csv'),
    ...QUERY_CONFIG
  });

  const awayQuery = useQuery<LeagueTableData[], Error>({
    queryKey: ['leagueTableAway'],
    queryFn: () => fetchTableData('/Data/tabela_ligas_away.csv'),
    ...QUERY_CONFIG
  });

  return {
    homeData: homeQuery.data || [],
    awayData: awayQuery.data || [],
    isLoading: homeQuery.isLoading || awayQuery.isLoading,
    isError: homeQuery.isError || awayQuery.isError,
    error: homeQuery.error || awayQuery.error,
    refetch: () => {
      homeQuery.refetch();
      awayQuery.refetch();
    }
  };
};
