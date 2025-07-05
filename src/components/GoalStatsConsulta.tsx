
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { useGoalStats } from '@/hooks/useGoalStats';
import { StatsDisplay } from './StatsDisplay';
import { FilteredLeagueAverage } from './FilteredLeagueAverage';
import { LeagueAverageDisplay } from './LeagueAverageDisplay';
import { SearchableSelect } from './SearchableSelect';
import { ProbableScores } from './ProbableScores';
import { DixonColesScores } from './DixonColesScores';
import { GoalMomentCard } from './GoalMomentCard';
import { Button } from '@/components/ui/button';

// Chave para armazenamento no localStorage
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
    return true; // Dixon-Coles por padrão
  });
  
  const { goalStatsData, isLoading, error } = useGoalStats();

  // Salva os filtros no localStorage sempre que mudam
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
    console.error('Error in GoalStatsConsulta:', error);
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600">Erro ao carregar dados: {error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando dados das equipes...</p>
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

  console.log('Extracted home teams:', homeTeams);
  console.log('Extracted away teams:', awayTeams);
  console.log('Home teams count:', homeTeams.length);
  console.log('Away teams count:', awayTeams.length);

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

  console.log('Home team league:', homeTeamLeague);
  console.log('Away team league:', awayTeamLeague);

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
    <div className="space-y-6">
      {/* Team Selection */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-gray-800">
            Selecione as Equipes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SearchableSelect
              value={selectedHomeTeam}
              onValueChange={setSelectedHomeTeam}
              options={homeTeams}
              placeholder="Selecione o time da casa"
              label="Time da Casa"
            />
            
            <SearchableSelect
              value={selectedAwayTeam}
              onValueChange={setSelectedAwayTeam}
              options={awayTeams}
              placeholder="Selecione o time visitante"
              label="Time Visitante"
            />
          </div>
        </CardContent>
      </Card>

      {shouldShowDifferentLeaguesWarning() && (
        <Card className="shadow-lg bg-gradient-to-r from-red-500 to-orange-500 text-white">
          <CardHeader>
            <CardTitle className="text-center text-xl">
              ⚠️ Ligas Diferentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-lg">Os times selecionados pertencem a ligas diferentes.</p>
              <p className="text-sm opacity-90 mt-2">
                Time da Casa: {homeTeamLeague}
              </p>
              <p className="text-sm opacity-90">
                Time Visitante: {awayTeamLeague}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {shouldShowLeagueAverage() && leagueAverageData && (
        <Card className="shadow-lg bg-gradient-to-r from-blue-500 to-green-500 text-white">
          <CardHeader>
            <CardTitle className="text-center text-xl">
              📊 Média da Liga: {leagueAverageData.League_Name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="hidden md:block overflow-x-auto">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="grid grid-cols-8 gap-4 text-center font-semibold">
                  <div>
                    <div className="text-sm opacity-90 mb-1">0.5+</div>
                    <div className="text-lg">{leagueAverageData["0.5+"]}%</div>
                  </div>
                  <div>
                    <div className="text-sm opacity-90 mb-1">1.5+</div>
                    <div className="text-lg">{leagueAverageData["1.5+"]}%</div>
                  </div>
                  <div>
                    <div className="text-sm opacity-90 mb-1">2.5+</div>
                    <div className="text-lg">{leagueAverageData["2.5+"]}%</div>
                  </div>
                  <div>
                    <div className="text-sm opacity-90 mb-1">3.5+</div>
                    <div className="text-lg">{leagueAverageData["3.5+"]}%</div>
                  </div>
                  <div>
                    <div className="text-sm opacity-90 mb-1">4.5+</div>
                    <div className="text-lg">{leagueAverageData["4.5+"]}%</div>
                  </div>
                  <div>
                    <div className="text-sm opacity-90 mb-1">5.5+</div>
                    <div className="text-lg">{leagueAverageData["5.5+"]}%</div>
                  </div>
                  <div>
                    <div className="text-sm opacity-90 mb-1">BTS</div>
                    <div className="text-lg">{leagueAverageData.BTS}%</div>
                  </div>
                  <div>
                    <div className="text-sm opacity-90 mb-1">CS</div>
                    <div className="text-lg">{leagueAverageData.CS}%</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="block md:hidden space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/20 rounded-lg p-3 text-center">
                  <div className="text-xs opacity-90">0.5+</div>
                  <div className="text-lg font-bold">{leagueAverageData["0.5+"]}%</div>
                </div>
                <div className="bg-white/20 rounded-lg p-3 text-center">
                  <div className="text-xs opacity-90">1.5+</div>
                  <div className="text-lg font-bold">{leagueAverageData["1.5+"]}%</div>
                </div>
                <div className="bg-white/20 rounded-lg p-3 text-center">
                  <div className="text-xs opacity-90">2.5+</div>
                  <div className="text-lg font-bold">{leagueAverageData["2.5+"]}%</div>
                </div>
                <div className="bg-white/20 rounded-lg p-3 text-center">
                  <div className="text-xs opacity-90">3.5+</div>
                  <div className="text-lg font-bold">{leagueAverageData["3.5+"]}%</div>
                </div>
                <div className="bg-white/20 rounded-lg p-3 text-center">
                  <div className="text-xs opacity-90">4.5+</div>
                  <div className="text-lg font-bold">{leagueAverageData["4.5+"]}%</div>
                </div>
                <div className="bg-white/20 rounded-lg p-3 text-center">
                  <div className="text-xs opacity-90">5.5+</div>
                  <div className="text-lg font-bold">{leagueAverageData["5.5+"]}%</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-white/20 rounded-lg p-3 text-center">
                  <div className="text-xs opacity-90">BTS</div>
                  <div className="text-lg font-bold">{leagueAverageData.BTS}%</div>
                </div>
                <div className="bg-white/20 rounded-lg p-3 text-center">
                  <div className="text-xs opacity-90">CS</div>
                  <div className="text-lg font-bold">{leagueAverageData.CS}%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* League Average Display for Selected Teams */}
      {(selectedHomeTeam || selectedAwayTeam) && (
        <LeagueAverageDisplay 
          homeStats={selectedHomeStats}
          awayStats={selectedAwayStats}
          leagueAverages={goalStatsData.leagueAverages}
          selectedHomeTeam={selectedHomeTeam}
          selectedAwayTeam={selectedAwayTeam}
        />
      )}

      {/* Filtered League Average */}
      {(selectedHomeTeam || selectedAwayTeam) && (
        <FilteredLeagueAverage 
          homeStats={selectedHomeStats}
          awayStats={selectedAwayStats}
          selectedHomeTeam={selectedHomeTeam}
          selectedAwayTeam={selectedAwayTeam}
        />
      )}

      {/* Stats Display */}
      {(selectedHomeTeam || selectedAwayTeam) && (
        <StatsDisplay 
          homeTeam={selectedHomeTeam}
          awayTeam={selectedAwayTeam}
          homeStats={selectedHomeStats}
          awayStats={selectedAwayStats}
        />
      )}

      {/* Goal Moment Card */}
      {(selectedHomeTeam || selectedAwayTeam) && (
        <GoalMomentCard
          homeTeam={selectedHomeTeam}
          awayTeam={selectedAwayTeam}
          homeGoalMoments={selectedHomeGoalMoments}
          awayGoalMoments={selectedAwayGoalMoments}
        />
      )}

      {/* Model Selection and Scores */}
      {selectedHomeStats && selectedAwayStats && (
        <div className="space-y-4">
          {/* Model Toggle */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-center text-xl text-gray-800">
                Modelo de Previsão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-4">
                <span className={`text-sm font-medium ${!useDixonColes ? 'text-blue-600' : 'text-gray-500'}`}>
                  Poisson Simples
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUseDixonColes(!useDixonColes)}
                  className="p-1"
                >
                  {useDixonColes ? (
                    <ToggleRight className="h-8 w-8 text-blue-600" />
                  ) : (
                    <ToggleLeft className="h-8 w-8 text-gray-400" />
                  )}
                </Button>
                <span className={`text-sm font-medium ${useDixonColes ? 'text-blue-600' : 'text-gray-500'}`}>
                  Dixon-Coles
                </span>
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                {useDixonColes 
                  ? 'Modelo avançado com correções para placares baixos e vantagem de casa'
                  : 'Modelo clássico baseado na distribuição de Poisson'
                }
              </p>
            </CardContent>
          </Card>

          {/* Score Predictions */}
          {useDixonColes ? (
            <DixonColesScores 
              homeStats={selectedHomeStats} 
              awayStats={selectedAwayStats} 
            />
          ) : (
            <ProbableScores 
              homeStats={selectedHomeStats} 
              awayStats={selectedAwayStats} 
            />
          )}
        </div>
      )}
    </div>
  );
};
