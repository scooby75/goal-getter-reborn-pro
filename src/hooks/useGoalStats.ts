
import { useQuery } from '@tanstack/react-query';
import { GoalStatsData } from '@/types/goalStats';
import { useHomeStats } from './useHomeStats';
import { useAwayStats } from './useAwayStats';
import { useOverallStats } from './useOverallStats';
import { useLeagueAverages } from './useLeagueAverages';
import { useGoalMomentStats } from './useGoalMomentStats';

export const useGoalStats = () => {
  console.log('useGoalStats hook called');

  const { data: homeStats = [], isLoading: homeLoading, error: homeError } = useHomeStats();
  const { data: awayStats = [], isLoading: awayLoading, error: awayError } = useAwayStats();
  const { data: overallStats = [], isLoading: overallLoading, error: overallError } = useOverallStats();
  const { data: leagueAverages = [], isLoading: leagueLoading, error: leagueError } = useLeagueAverages();
  const { 
    homeGoalMoments = [], 
    awayGoalMoments = [], 
    isLoading: goalMomentLoading, 
    error: goalMomentError 
  } = useGoalMomentStats();

  const isLoading = homeLoading || awayLoading || overallLoading || leagueLoading || goalMomentLoading;
  const error = homeError || awayError || overallError || leagueError || goalMomentError;

  console.log('Data loading status:', {
    homeStats: homeStats.length,
    awayStats: awayStats.length,
    overallStats: overallStats.length,
    leagueAverages: leagueAverages.length,
    homeGoalMoments: homeGoalMoments.length,
    awayGoalMoments: awayGoalMoments.length,
    isLoading,
    error: error?.message
  });

  const calculateLeagueAverage = () => {
    if (overallStats.length === 0) return { "1.5+": 0, "2.5+": 0, "3.5+": 0, "4.5+": 0 };
    
    const total15 = overallStats.reduce((sum, team) => sum + team["1.5+"], 0);
    const total25 = overallStats.reduce((sum, team) => sum + team["2.5+"], 0);
    const total35 = overallStats.reduce((sum, team) => sum + team["3.5+"], 0);
    const total45 = overallStats.reduce((sum, team) => sum + team["4.5+"], 0);
    
    return {
      "1.5+": Math.round((total15 / overallStats.length) * 100) / 100,
      "2.5+": Math.round((total25 / overallStats.length) * 100) / 100,
      "3.5+": Math.round((total35 / overallStats.length) * 100) / 100,
      "4.5+": Math.round((total45 / overallStats.length) * 100) / 100,
    };
  };

  const goalStatsData: GoalStatsData = {
    homeStats,
    awayStats,
    overallStats,
    leagueAverage: calculateLeagueAverage(),
    leagueAverages,
    homeGoalMoments,
    awayGoalMoments,
  };

  console.log('Final goal stats data:', { 
    isLoading, 
    error: error?.message, 
    homeCount: homeStats.length,
    awayCount: awayStats.length,
    overallCount: overallStats.length,
    leagueAveragesCount: leagueAverages.length,
    homeGoalMomentsCount: homeGoalMoments.length,
    awayGoalMomentsCount: awayGoalMoments.length
  });

  return { goalStatsData, isLoading, error };
};
