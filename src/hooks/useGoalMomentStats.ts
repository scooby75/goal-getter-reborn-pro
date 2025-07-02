import { useQuery } from '@tanstack/react-query';
import { GoalMomentStats } from '@/types/goalStats';
import { fetchCSVWithRetry } from '@/utils/csvHelpers';
import { parseGoalMomentCSV } from '@/utils/csvParsers';
import { useMemo } from 'react';

// Configurações padrão para as queries
const DEFAULT_QUERY_CONFIG = {
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  staleTime: 5 * 60 * 1000, // 5 minutos
  gcTime: 10 * 60 * 1000, // 10 minutos
} as const;

// ✅ URLs tipados e constantes
const CSV_URLS = {
  HOME_GOAL_MOMENTS: '/Data/momento_do_gol_home.csv',
  AWAY_GOAL_MOMENTS: '/Data/momento_do_gol_away.csv'
} as const;

// Função de fetch com tratamento de erros robusto
const fetchGoalMomentData = async (url: string): Promise<GoalMomentStats[]> => {
  try {
    const csvText = await fetchCSVWithRetry(url);
    if (!csvText) {
      throw new Error('Conteúdo CSV vazio ou não recebido');
    }
    const parsedData = parseGoalMomentCSV(csvText);
    
    // Validação básica dos dados
    if (!Array.isArray(parsedData)) {
      throw new Error('Formato inválido dos dados parseados');
    }
    
    return parsedData;
  } catch (error) {
    console.error(`Erro ao carregar dados de ${url}:`, error);
    throw new Error(`Falha ao carregar momentos de gol: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
};

export const useGoalMomentStats = () => {
  // Consultas individuais com tipagem forte
  const homeQuery = useQuery<GoalMomentStats[], Error>({
    queryKey: ['homeGoalMoments'],
    queryFn: () => fetchGoalMomentData(CSV_URLS.HOME_GOAL_MOMENTS),
    ...DEFAULT_QUERY_CONFIG
  });

  const awayQuery = useQuery<GoalMomentStats[], Error>({
    queryKey: ['awayGoalMoments'],
    queryFn: () => fetchGoalMomentData(CSV_URLS.AWAY_GOAL_MOMENTS),
    ...DEFAULT_QUERY_CONFIG
  });

  // Estados consolidados com useMemo para otimização
  const isLoading = useMemo(() => 
    homeQuery.isLoading || awayQuery.isLoading,
    [homeQuery.isLoading, awayQuery.isLoading]
  );

  const isFetching = useMemo(() => 
    homeQuery.isFetching || awayQuery.isFetching,
    [homeQuery.isFetching, awayQuery.isFetching]
  );

  const error = useMemo(() => {
    if (homeQuery.error) return `Home: ${homeQuery.error.message}`;
    if (awayQuery.error) return `Away: ${awayQuery.error.message}`;
    return null;
  }, [homeQuery.error, awayQuery.error]);

  // Retorno completo com todas as funcionalidades
  return {
    homeGoalMoments: homeQuery.data || [],
    awayGoalMoments: awayQuery.data || [],
    isLoading,
    isFetching,
    error,
    refetchAll: () => Promise.all([homeQuery.refetch(), awayQuery.refetch()]),
    queries: {
      home: homeQuery,
      away: awayQuery
    }
  };
};
