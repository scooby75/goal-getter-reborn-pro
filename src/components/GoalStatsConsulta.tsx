import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, ToggleLeft, ToggleRight, Shield, TrendingUp } from 'lucide-react';
import { useGoalStats } from '@/hooks/useGoalStats';
import { StatsDisplay } from './StatsDisplay';
import { FilteredLeagueAverage } from './FilteredLeagueAverage';
import { LeagueAverageDisplay } from './LeagueAverageDisplay';
import { SearchableSelect } from './SearchableSelect';
import { ProbableScores } from './ProbableScores';
import { DixonColesScores } from './DixonColesScores';
import { GoalMomentCard } from './GoalMomentCard';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'goalStatsFilters';

export const GoalStatsConsulta = () => {
  console.log('GoalStatsConsulta component rendering');
  
  // Estados iniciais carregados do localStorage
  const [selectedHomeTeam, setSelectedHomeTeam] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedFilters = localStorage.getItem(STORAGE_KEY);
      return savedFilters ? JSON.parse(savedFilters).homeTeam : '';
    }
    return '';
  });
  
  const [selectedAwayTeam, setSelectedAwayTeam] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedFilters = localStorage.getItem(STORAGE_KEY);
      return savedFilters ? JSON.parse(savedFilters).awayTeam : '';
    }
    return '';
  });

  // Estado para alternar entre modelos
  const [useDixonColes, setUseDixonColes] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedPreference = localStorage.getItem('scorePredictionModel');
      return savedPreference === 'dixon-coles';
    }
    return true;
  });
  
  const { goalStatsData, isLoading, error } = useGoalStats();

  // Salva os filtros no localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        homeTeam: selectedHomeTeam,
        awayTeam: selectedAwayTeam
      }));
    }
  }, [selectedHomeTeam, selectedAwayTeam]);

  // Salva preferência do modelo
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('scorePredictionModel', useDixonColes ? 'dixon-coles' : 'poisson');
    }
  }, [useDixonColes]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center bg-white/95 backdrop-blur-sm border border-red-200 p-6 rounded-lg shadow-lg">
          <AlertCircle className="h-8 w-8 mx-auto mb-3 text-red-500" />
          <p className="text-red-600 font-semibold text-sm">Erro ao carregar dados: {error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center bg-white/95 backdrop-blur-sm border border-blue-200 p-6 rounded-lg shadow-lg">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-600" />
          <p className="text-blue-600 font-semibold text-sm">Carregando dados das equipes...</p>
        </div>
      </div>
    );
  }

  const homeTeams = goalStatsData.homeStats
    .map(team => team.Team)
    .filter(teamName => teamName && teamName.trim() !== '')
    .sort();
    
  const awayTeams = goalStatsData.awayStats
    .map(team => team.Team)
    .filter(teamName => teamName && teamName.trim() !== '')
    .sort();

  const selectedHomeStats = goalStatsData.homeStats.find(team => team.Team === selectedHomeTeam);
  const selectedAwayStats = goalStatsData.awayStats.find(team => team.Team === selectedAwayTeam);

  const getTeamLeague = (teamName: string, isHome: boolean) => {
    const stats = isHome 
      ? goalStatsData.homeStats.find(team => team.Team === teamName)
      : goalStatsData.awayStats.find(team => team.Team === teamName);
    return stats?.League_Name;
  };

  const homeTeamLeague = selectedHomeTeam ? getTeamLeague(selectedHomeTeam, true) : null;
  const awayTeamLeague = selectedAwayTeam ? getTeamLeague(selectedAwayTeam, false) : null;

  const shouldShowLeagueAverage = () => {
    if (!selectedHomeTeam && !selectedAwayTeam) return false;
    if (selectedHomeTeam && selectedAwayTeam) {
      return homeTeamLeague === awayTeamLeague && homeTeamLeague;
    }
    return true;
  };

  const shouldShowDifferentLeaguesWarning = () => {
    return selectedHomeTeam && selectedAwayTeam && 
           homeTeamLeague && awayTeamLeague && 
           homeTeamLeague !== awayTeamLeague;
  };

  const getLeagueAverageData = () => {
    const targetLeague = homeTeamLeague || awayTeamLeague;
    if (!targetLeague) return null;
    
    return goalStatsData.leagueAverages.find(
      league => league.League_Name === targetLeague
    );
  };

  const leagueAverageData = getLeagueAverageData();

  // Get goal moment data
  const selectedHomeGoalMoments = goalStatsData.homeGoalMoments?.find(
    team => team.Team === selectedHomeTeam
  );
  const selectedAwayGoalMoments = goalStatsData.awayGoalMoments?.find(
    team => team.Team === selectedAwayTeam
  );

  return (
    <div className="space-y-4 p-3 min-h-screen gradient-crypto">
      {/* Team Selection - Apenas duas colunas agora */}
      <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg relative z-20">
        <CardHeader className="pb-3">
          <CardTitle className="text-center text-xl text-gray-800 flex items-center justify-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Seleção de Equipes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 overflow-visible">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-visible">
            <div className="relative z-30">
              <SearchableSelect
                value={selectedHomeTeam}
                onValueChange={setSelectedHomeTeam}
                options={homeTeams}
                placeholder="Selecione o time da casa"
                label={`Time da Casa (${homeTeams.length} times disponíveis)`}
                className="z-50"
                dropdownClassName="z-50"
              />
            </div>
            
            <div className="relative z-30">
              <SearchableSelect
                value={selectedAwayTeam}
                onValueChange={setSelectedAwayTeam}
                options={awayTeams}
                placeholder="Selecione o time visitante"
                label={`Time Visitante (${awayTeams.length} times disponíveis)`}
                className="z-50"
                dropdownClassName="z-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Restante do código permanece igual */}
      {shouldShowDifferentLeaguesWarning() && (
        <Card className="bg-white/95 backdrop-blur-sm border-red-300 shadow-lg z-10">
          {/* ... */}
        </Card>
      )}

      {shouldShowLeagueAverage() && leagueAverageData && (
        <Card className="bg-white/95 backdrop-blur-sm border-blue-200 shadow-lg z-10">
          {/* ... */}
        </Card>
      )}

      {/* Outros componentes permanecem iguais */}
      {/* ... */}
    </div>
  );
};
