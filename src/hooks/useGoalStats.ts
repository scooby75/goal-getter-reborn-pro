import { useQuery } from '@tanstack/react-query';
import { GoalStatsData } from '@/types/goalStats';
import { useHomeStats } from './useHomeStats';
import { useAwayStats } from './useAwayStats';
import { useOverallStats } from './useOverallStats';
import { useLeagueAverages } from './useLeagueAverages';
import { useGoalMomentStats } from './useGoalMomentStats';
import { useMemo } from 'react';

export const useGoalStats = () => {
  // 1. Buscar todos os dados necessários
  const homeStatsQuery = useHomeStats();
  const awayStatsQuery = useAwayStats();
  const overallStatsQuery = useOverallStats();
  const leagueAveragesQuery = useLeagueAverages();
  const goalMomentStatsQuery = useGoalMomentStats();

  // 2. Calcular estado agregado
  const isLoading = useMemo(() => (
    homeStatsQuery.isLoading ||
    awayStatsQuery.isLoading ||
    overallStatsQuery.isLoading ||
    leagueAveragesQuery.isLoading ||
    goalMomentStatsQuery.isLoading
  ), [
    homeStatsQuery.isLoading,
    awayStatsQuery.isLoading,
    overallStatsQuery.isLoading,
    leagueAveragesQuery.isLoading,
    goalMomentStatsQuery.isLoading
  ]);

  const error = useMemo(() => {
    if (homeStatsQuery.error) return `Home stats error: ${homeStatsQuery.error}`;
    if (awayStatsQuery.error) return `Away stats error: ${awayStatsQuery.error}`;
    if (overallStatsQuery.error) return `Overall stats error: ${overallStatsQuery.error}`;
    if (leagueAveragesQuery.error) return `League averages error: ${leagueAveragesQuery.error}`;
    if (goalMomentStatsQuery.error) return `Goal moment stats error: ${goalMomentStatsQuery.error}`;
    return null;
  }, [
    homeStatsQuery.error,
    awayStatsQuery.error,
    overallStatsQuery.error,
    leagueAveragesQuery.error,
    goalMomentStatsQuery.error
  ]);

  // 3. Calcular médias da liga
  const leagueAverage = useMemo(() => {
    if (!overallStatsQuery.data || !Array.isArray(overallStatsQuery.data) || overallStatsQuery.data.length === 0) {
      return { "1.5+": 0, "2.5+": 0, "3.5+": 0, "4.5+": 0 };
    }
    
    const totals = overallStatsQuery.data.reduce((acc, team) => ({
      "1.5+": acc["1.5+"] + (team["1.5+"] || 0),
      "2.5+": acc["2.5+"] + (team["2.5+"] || 0),
      "3.5+": acc["3.5+"] + (team["3.5+"] || 0),
      "4.5+": acc["4.5+"] + (team["4.5+"] || 0),
    }), { "1.5+": 0, "2.5+": 0, "3.5+": 0, "4.5+": 0 });
    
    const count = overallStatsQuery.data.length;
    return {
      "1.5+": parseFloat((totals["1.5+"] / count).toFixed(2)),
      "2.5+": parseFloat((totals["2.5+"] / count).toFixed(2)),
      "3.5+": parseFloat((totals["3.5+"] / count).toFixed(2)),
      "4.5+": parseFloat((totals["4.5+"] / count).toFixed(2)),
    };
  }, [overallStatsQuery.data]);

  // 4. Preparar dados consolidados
  const goalStatsData: GoalStatsData = useMemo(() => ({
    homeStats: homeStatsQuery.data || [],
    awayStats: awayStatsQuery.data || [],
    overallStats: overallStatsQuery.data || [],
    leagueAverage,
    leagueAverages: leagueAveragesQuery.data || [],
    homeGoalMoments: goalMomentStatsQuery.homeGoalMoments || [],
    awayGoalMoments: goalMomentStatsQuery.awayGoalMoments || [],
  }), [
    homeStatsQuery.data,
    awayStatsQuery.data,
    overallStatsQuery.data,
    leagueAverage,
    leagueAveragesQuery.data,
    goalMomentStatsQuery.homeGoalMoments,
    goalMomentStatsQuery.awayGoalMoments
  ]);

  // 5. Função para recarregar todos os dados
  const refetchAll = () => {
    homeStatsQuery.refetchAll();
    awayStatsQuery.refetchAll();
    overallStatsQuery.refetch();
    leagueAveragesQuery.refetch();
    goalMomentStatsQuery.refetchAll();
  };

  return { 
    goalStatsData, 
    isLoading, 
    isFetching: !isLoading && (
      homeStatsQuery.isFetching ||
      awayStatsQuery.isFetching ||
      overallStatsQuery.isRefetching ||
      leagueAveragesQuery.isFetching ||
      goalMomentStatsQuery.isFetching
    ),
    error,
    refetch: refetchAll
  };
};
