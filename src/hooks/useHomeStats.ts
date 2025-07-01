import { useQuery } from '@tanstack/react-query';
import { TeamStats, GoalsHalfStats, ScoredFirstStats } from '@/types/goalStats';
import { fetchCSVWithRetry } from '@/utils/csvHelpers';
import { parseCSV, parseGoalsHalfCSV, parseScoredFirstCSV } from '@/utils/csvParsers';
import { useMemo } from 'react';

// Configurações constantes para as queries
const QUERY_CONFIG = {
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  staleTime: 5 * 60 * 1000, // 5 minutos
  gcTime: 10 * 60 * 1000, // 10 minutos
} as const;

// URLs com tipagem constante e validação
const CSV_URLS = {
  HOME_STATS: 'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/Goals_Stats_Home.csv',
  GOALS_HALF: 'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/Goals_Half.csv',
  SCORED_FIRST_HOME: 'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/scored_first_home.csv'
} as const;

// Função principal de fetch com tratamento de erros completo
const fetchTeamData = async <T,>(url: string, parser: (data: string) => T[]): Promise<T[]> => {
  try {
    const csvText = await fetchCSVWithRetry(url);
    if (!csvText?.trim()) {
      throw new Error('Conteúdo CSV vazio ou inválido');
    }
    return parser(csvText);
  } catch (error) {
    console.error(`Erro ao processar ${url}:`, error);
    throw new Error(`Falha ao carregar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
};

// Funções específicas para cada tipo de dado
const fetchHomeStats = async (): Promise<TeamStats[]> => 
  fetchTeamData(CSV_URLS.HOME_STATS, parseCSV);

const fetchGoalsHalfStats = async (): Promise<GoalsHalfStats[]> => 
  fetchTeamData(CSV_URLS.GOALS_HALF, parseGoalsHalfCSV);

const fetchScoredFirstStats = async (): Promise<ScoredFirstStats[]> => 
  fetchTeamData(CSV_URLS.SCORED_FIRST_HOME, parseScoredFirstCSV);

export const useHomeStats = () => {
  // Consultas individuais com tratamento de erro específico
  const homeStatsQuery = useQuery<TeamStats[], Error>({
    queryKey: ['homeStats'],
    queryFn: fetchHomeStats,
    ...QUERY_CONFIG,
    onError: (error) => console.error('Erro nos dados principais:', error)
  });

  const goalsHalfQuery = useQuery<GoalsHalfStats[], Error>({
    queryKey: ['goalsHalf'],
    queryFn: fetchGoalsHalfStats,
    ...QUERY_CONFIG,
    onError: (error) => console.error('Erro nos dados por tempo:', error)
  });

  const scoredFirstQuery = useQuery<ScoredFirstStats[], Error>({
    queryKey: ['scoredFirstHome'],
    queryFn: fetchScoredFirstStats,
    ...QUERY_CONFIG,
    onError: (error) => console.error('Erro nos dados de primeiro gol:', error)
  });

  // Combinação otimizada dos dados
  const mergedData = useMemo(() => {
    if ([homeStatsQuery.data, goalsHalfQuery.data, scoredFirstQuery.data].some(d => !d)) {
      return [];
    }

    return homeStatsQuery.data!.map(team => {
      const teamName = team.Team?.toLowerCase();
      const leagueName = team.League_Name?.toLowerCase();

      // Encontrar dados complementares
      const halfData = goalsHalfQuery.data!.find(d => d.Team?.toLowerCase() === teamName);
      const scoredFirstMatches = scoredFirstQuery.data!.filter(d => d.Team?.toLowerCase() === teamName);
      
      const scoredFirstData = scoredFirstMatches.length === 1 
        ? scoredFirstMatches[0]
        : scoredFirstMatches.find(d => d.League && leagueName?.includes(d.League.toLowerCase()));

      // Construir objeto combinado
      return {
        ...team,
        ...(halfData && {
          '1st half': halfData['1st half'],
          '2nd half': halfData['2nd half'],
          'Avg. minute': halfData['Avg. minute']
        }),
        ...(scoredFirstData && {
          scoredFirstPerc: scoredFirstData['Perc.']
        })
      };
    });
  }, [homeStatsQuery.data, goalsHalfQuery.data, scoredFirstQuery.data]);

  // Estados consolidados com memoização
  const isLoading = useMemo(() => 
    homeStatsQuery.isLoading || goalsHalfQuery.isLoading || scoredFirstQuery.isLoading,
    [homeStatsQuery.isLoading, goalsHalfQuery.isLoading, scoredFirstQuery.isLoading]
  );

  const isFetching = useMemo(() => 
    homeStatsQuery.isFetching || goalsHalfQuery.isFetching || scoredFirstQuery.isFetching,
    [homeStatsQuery.isFetching, goalsHalfQuery.isFetching, scoredFirstQuery.isFetching]
  );

  const error = useMemo(() => {
    const errors = [
      homeStatsQuery.error && `Estatísticas principais: ${homeStatsQuery.error.message}`,
      goalsHalfQuery.error && `Dados por tempo: ${goalsHalfQuery.error.message}`,
      scoredFirstQuery.error && `Primeiro gol: ${scoredFirstQuery.error.message}`
    ].filter(Boolean);
    
    return errors.length ? errors.join(' | ') : null;
  }, [homeStatsQuery.error, goalsHalfQuery.error, scoredFirstQuery.error]);

  // Retorno completo com todas as funcionalidades
  return {
    data: mergedData,
    isLoading,
    isFetching,
    error,
    refetchAll: () => Promise.all([
      homeStatsQuery.refetch(),
      goalsHalfQuery.refetch(),
      scoredFirstQuery.refetch()
    ]),
    queries: {
      homeStats: homeStatsQuery,
      goalsHalf: goalsHalfQuery,
      scoredFirst: scoredFirstQuery
    }
  };
};
