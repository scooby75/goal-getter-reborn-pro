import { useQuery } from '@tanstack/react-query';
import { TeamStats, GoalsHalfStats, ScoredFirstStats } from '@/types/goalStats';
import { fetchCSVWithRetry } from '@/utils/csvHelpers';
import { parseCSV, parseGoalsHalfCSV, parseScoredFirstCSV } from '@/utils/csvParsers';
import { useMemo } from 'react';

// Configurações comuns para as queries
const DEFAULT_QUERY_CONFIG = {
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  staleTime: 5 * 60 * 1000, // 5 minutos
  gcTime: 10 * 60 * 1000, // 10 minutos
};

// ✅ URLs corrigidos e tipados
const CSV_URLS = {
  AWAY_STATS: 'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/Goals_Stats_Away.csv',
  GOALS_HALF: 'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/Goals_Half.csv',
  SCORED_FIRST_AWAY: 'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/scored_first_away.csv'
} as const;

// Função de fetch com tratamento de erros melhorado
const fetchCSVData = async (url: string): Promise<TeamStats[]> => {
  try {
    const csvText = await fetchCSVWithRetry(url);
    if (!csvText) throw new Error('Empty CSV content');
    return parseCSV(csvText);
  } catch (error) {
    console.error(`Failed to fetch or parse CSV from ${url}:`, error);
    throw new Error(`Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const fetchGoalsHalfData = async (): Promise<GoalsHalfStats[]> => {
  return fetchCSVData(CSV_URLS.GOALS_HALF).then(data => 
    parseGoalsHalfCSV(data as unknown as string)
  );
};

const fetchScoredFirstAwayData = async (): Promise<ScoredFirstStats[]> => {
  return fetchCSVData(CSV_URLS.SCORED_FIRST_AWAY).then(data => 
    parseScoredFirstCSV(data as unknown as string)
  );
};

export const useAwayStats = () => {
  // Consultas individuais com tipagem forte
  const awayStatsQuery = useQuery<TeamStats[], Error>({
    queryKey: ['awayStats'],
    queryFn: () => fetchCSVData(CSV_URLS.AWAY_STATS),
    ...DEFAULT_QUERY_CONFIG
  });

  const goalsHalfQuery = useQuery<GoalsHalfStats[], Error>({
    queryKey: ['goalsHalf'],
    queryFn: fetchGoalsHalfData,
    ...DEFAULT_QUERY_CONFIG
  });

  const scoredFirstAwayQuery = useQuery<ScoredFirstStats[], Error>({
    queryKey: ['scoredFirstAway'],
    queryFn: fetchScoredFirstAwayData,
    ...DEFAULT_QUERY_CONFIG
  });

  // Combinação de dados com verificações de segurança
  const mergedAwayStats = useMemo(() => {
    if (!awayStatsQuery.data || !goalsHalfQuery.data || !scoredFirstAwayQuery.data) {
      return [];
    }

    return awayStatsQuery.data.map(team => {
      const halfData = goalsHalfQuery.data.find(d => d.Team?.toLowerCase() === team.Team?.toLowerCase());
      
      const potentialMatches = scoredFirstAwayQuery.data.filter(d => 
        d.Team?.toLowerCase() === team.Team?.toLowerCase()
      );
      
      const scoredFirstData = potentialMatches.length === 1 
        ? potentialMatches[0] 
        : potentialMatches.find(d => 
            d.League && team.League_Name && 
            team.League_Name.toLowerCase().includes(d.League.toLowerCase())
          );

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
  }, [awayStatsQuery.data, goalsHalfQuery.data, scoredFirstAwayQuery.data]);

  // Estados consolidados com tratamento de erros granular
  const isLoading = awayStatsQuery.isLoading || goalsHalfQuery.isLoading || scoredFirstAwayQuery.isLoading;
  const isFetching = awayStatsQuery.isFetching || goalsHalfQuery.isFetching || scoredFirstAwayQuery.isFetching;
  
  const error = useMemo(() => {
    if (awayStatsQuery.error) return `Away stats error: ${awayStatsQuery.error.message}`;
    if (goalsHalfQuery.error) return `Goals half error: ${goalsHalfQuery.error.message}`;
    if (scoredFirstAwayQuery.error) return `Scored first error: ${scoredFirstAwayQuery.error.message}`;
    return null;
  }, [awayStatsQuery.error, goalsHalfQuery.error, scoredFirstAwayQuery.error]);

  // Retorno completo com todas as funcionalidades
  return { 
    data: mergedAwayStats,
    isLoading,
    isFetching,
    error,
    refetchAll: () => {
      awayStatsQuery.refetch();
      goalsHalfQuery.refetch();
      scoredFirstAwayQuery.refetch();
    },
    queries: {
      awayStats: awayStatsQuery,
      goalsHalf: goalsHalfQuery,
      scoredFirstAway: scoredFirstAwayQuery
    }
  };
};
