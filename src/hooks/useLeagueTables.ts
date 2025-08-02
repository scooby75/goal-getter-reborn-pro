
import { useQuery } from '@tanstack/react-query';
import Papa from 'papaparse';

export interface LeagueTableData {
  Ranking: string;
  Team: string;
  GP: number;
  W: number;
  D: number;
  L: number;
  GF: number;
  GA: number;
  GD: string;
  Pts: number;
  Liga: string;
}

const QUERY_CONFIG = {
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
  staleTime: 10 * 60 * 1000,
  gcTime: 20 * 60 * 1000,
} as const;

const fetchTableData = async (url: string, isAway: boolean = false): Promise<LeagueTableData[]> => {
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
      // Use the correct column names based on CSV structure
      const teamColumn = isAway ? 'Team_Away' : 'Team_Home';
      const team = row[teamColumn] || '';
      const ranking = row.Ranking || row.ranking || '';
      const gd = row.GD || row.gd || '';
      const liga = row.Liga || row.liga || '';
      const gp = parseInt(row.GP || '0', 10) || 0;
      const w = parseInt(row.W || '0', 10) || 0;
      const d = parseInt(row.D || '0', 10) || 0;
      const l = parseInt(row.L || '0', 10) || 0;
      const gf = parseInt(row.GF || '0', 10) || 0;
      const ga = parseInt(row.GA || '0', 10) || 0;
      const pts = parseInt(row.Pts || '0', 10) || 0;
      
      console.log(`Processing team: ${team}, ranking: ${ranking}, GD: ${gd}`);
      
      return {
        Ranking: ranking,
        Team: team,
        GP: gp,
        W: w,
        D: d,
        L: l,
        GF: gf,
        GA: ga,
        GD: gd,
        Pts: pts,
        Liga: liga
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
    queryFn: () => fetchTableData('/Data/tabela_ligas_home.csv', false),
    ...QUERY_CONFIG
  });

  const awayQuery = useQuery<LeagueTableData[], Error>({
    queryKey: ['leagueTableAway'],
    queryFn: () => fetchTableData('/Data/tabela_ligas_away.csv', true),
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
