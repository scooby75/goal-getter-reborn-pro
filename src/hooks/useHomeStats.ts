import { useQuery } from '@tanstack/react-query';
import { TeamStats, GoalsHalfStats, ScoredFirstStats } from '@/types/goalStats';
import { fetchCSVWithRetry } from '@/utils/csvHelpers';
import { parseCSV, parseGoalsHalfCSV, parseScoredFirstCSV } from '@/utils/csvParsers';
import { useMemo } from 'react';

// ✅ URLs corrigidos para raw.githubusercontent.com
const CSV_URLS = {
  HOME_STATS: 'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/Goals_Stats_Home.csv',
  GOALS_HALF: 'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/Goals_Half.csv',
  SCORED_FIRST_HOME: 'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/scored_first_home.csv'
};

// Configurações comuns para as queries
const queryConfig = {
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  staleTime: 5 * 60 * 1000, // 5 minutos
  gcTime: 10 * 60 * 1000, // 10 minutos
};

const fetchCSVData = async (url: string): Promise<TeamStats[]> => {
  const csvText = await fetchCSVWithRetry(url);
  return parseCSV(csvText);
};

const fetchGoalsHalfData = async (): Promise<GoalsHalfStats[]> => {
  const csvText = await fetchCSVWithRetry(CSV_URLS.GOALS_HALF);
  return parseGoalsHalfCSV(csvText);
};

const fetchScoredFirstHomeData = async (): Promise<ScoredFirstStats[]> => {
  const csvText = await fetchCSVWithRetry(CSV_URLS.SCORED_FIRST_HOME);
  return parseScoredFirstCSV(csvText);
};

export const useHomeStats = () => {
  // Buscar dados individuais
  const homeStatsQuery = useQuery<TeamStats[], Error>({
    queryKey: ['homeStats'],
    queryFn: () => fetchCSVData(CSV_URLS.HOME_STATS),
    ...queryConfig
  });

  const goalsHalfQuery = useQuery<GoalsHalfStats[], Error>({
    queryKey: ['goalsHalf'],
    queryFn: fetchGoalsHalfData,
    ...queryConfig
  });

  const scoredFirstHomeQuery = useQuery<ScoredFirstStats[], Error>({
    queryKey: ['scoredFirstHome'],
    queryFn: fetchScoredFirstHomeData,
    ...queryConfig
  });

  // Combinar os dados
  const mergedHomeStats = useMemo(() => {
    if (!homeStatsQuery.data || !goalsHalfQuery.data || !scoredFirstHomeQuery.data) {
      return [];
    }

    return homeStatsQuery.data.map(team => {
      const halfData = goalsHalfQuery.data.find(d => d.Team === team.Team);
      
      const potentialMatches = scoredFirstHomeQuery.data.filter(d => d.Team === team.Team);
      let scoredFirstData: ScoredFirstStats | undefined;

      if (potentialMatches.length === 1) {
        scoredFirstData = potentialMatches[0];
      } else if (potentialMatches.length > 1) {
        scoredFirstData = potentialMatches.find(d => 
          d.League && team.League_Name && 
          team.League_Name.toLowerCase().includes(d.League.toLowerCase())
        );
      }
      
      const newStats: Partial<TeamStats> = {};
      if (halfData) {
        newStats['1st half'] = halfData['1st half'];
        newStats['2nd half'] = halfData['2nd half'];
        newStats['Avg. minute'] = halfData['Avg. minute'];
      }
      if (scoredFirstData) {
        newStats.scoredFirstPerc = scoredFirstData['Perc.'];
      }
      
      return { ...team, ...newStats };
    });
  }, [homeStatsQuery.data, goalsHalfQuery.data, scoredFirstHomeQuery.data]);

  // Estados consolidados
  const isLoading = homeStatsQuery.isLoading || goalsHalfQuery.isLoading || scoredFirstHomeQuery.isLoading;
  const isFetching = homeStatsQuery.isFetching || goalsHalfQuery.isFetching || scoredFirstHomeQuery.isFetching;
  
  const error = useMemo(() => {
    if (homeStatsQuery.error) return `Erro nas estatísticas de casa: ${homeStatsQuery.error.message}`;
    if (goalsHalfQuery.error) return `Erro nos dados de tempo de jogo: ${goalsHalfQuery.error.message}`;
    if (scoredFirstHomeQuery.error) return `Erro nos dados de primeiro gol: ${scoredFirstHomeQuery.error.message}`;
    return null;
  }, [homeStatsQuery.error, goalsHalfQuery.error, scoredFirstHomeQuery.error]);

  // Função para recarregar todos os dados
  const refetchAll = () => {
    homeStatsQuery.refetch();
    goalsHalfQuery.refetch();
    scoredFirstHomeQuery.refetch();
  };

  return { 
    data: mergedHomeStats, 
    isLoading,
    isFetching,
    error,
    refetch: refetchAll
  };
};
