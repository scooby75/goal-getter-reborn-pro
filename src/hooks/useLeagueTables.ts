
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
    console.log(`Fetching table data from: ${url}`);
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
    console.log(`CSV preview for ${url}:`, csvText.substring(0, 300));
    
    const result = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transform: (value, field) => {
        return typeof value === 'string' ? value.trim() : value;
      }
    });

    if (!result.data) {
      throw new Error('Falha ao processar CSV');
    }

    console.log(`Headers for ${url}:`, Object.keys(result.data[0] || {}));
    console.log(`Sample data for ${url}:`, result.data.slice(0, 3));

    const processedData = result.data.map((row: any) => {
      // Try different possible column names
      const team = row.Team || row.team || row.TIME || row.time || '';
      const ranking = parseInt(row.ranking || row.Ranking || row.RANKING || row.pos || row.Pos || row.POS || '0', 10) || 0;
      const gd = parseInt(row.GD || row.gd || row.SG || row.sg || row['Saldo de Gols'] || '0', 10) || 0;
      const league = row.League || row.league || row.Liga || row.liga || '';
      
      console.log(`Processing team: ${team}, ranking: ${ranking}, GD: ${gd}`);
      
      return {
        Team: team,
        ranking: ranking,
        GD: gd,
        League: league
      };
    }).filter(item => item.Team && item.Team.trim() !== '');

    console.log(`Processed ${processedData.length} teams from ${url}`);
    return processedData;
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

  console.log('Home table data loaded:', homeQuery.data?.slice(0, 3));
  console.log('Away table data loaded:', awayQuery.data?.slice(0, 3));

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
