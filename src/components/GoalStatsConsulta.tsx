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
        <div className="text-center glass-effect p-8 rounded-xl crypto-shadow">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <p className="text-red-400 font-semibold">Erro ao carregar dados: {error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center glass-effect p-8 rounded-xl crypto-shadow">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-crypto-steel" />
          <p className="text-crypto-steel font-semibold">Carregando dados das equipes...</p>
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
    <div className="space-y-6 p-6 min-h-screen gradient-crypto">
      {/* Team Selection */}
      <Card className="glass-effect border-crypto-steel/30 crypto-shadow">
        <CardHeader>
          <CardTitle className="text-center text-3xl text-white flex items-center justify-center gap-3">
            <Shield className="h-8 w-8 text-crypto-steel" />
            Seleção de Equipes
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
        <Card className="glass-effect border-red-400/50 crypto-shadow">
          <CardHeader>
            <CardTitle className="text-center text-xl text-red-400 flex items-center justify-center gap-2">
              <AlertCircle className="h-6 w-6" />
              Ligas Diferentes Detectadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-2">
              <p className="text-white font-semibold">Os times selecionados pertencem a ligas diferentes.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="glass-effect p-4 rounded-lg">
                  <p className="text-crypto-light text-sm font-medium">Time da Casa</p>
                  <p className="text-white font-bold">{homeTeamLeague}</p>
                </div>
                <div className="glass-effect p-4 rounded-lg">
                  <p className="text-crypto-light text-sm font-medium">Time Visitante</p>
                  <p className="text-white font-bold">{awayTeamLeague}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {shouldShowLeagueAverage() && leagueAverageData && (
        <Card className="glass-effect border-crypto-steel/50 crypto-shadow">
          <CardHeader>
            <CardTitle className="text-center text-2xl text-white flex items-center justify-center gap-3">
              <TrendingUp className="h-7 w-7 text-crypto-steel" />
              Média da Liga: {leagueAverageData.League_Name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="hidden md:block overflow-x-auto">
              <div className="glass-effect rounded-lg p-6">
                <div className="grid grid-cols-8 gap-4 text-center">
                  {['0.5+', '1.5+', '2.5+', '3.5+', '4.5+', '5.5+', 'BTS', 'CS'].map((key, index) => (
                    <div key={key} className="space-y-2">
                      <div className="text-sm text-crypto-light font-medium">{key}</div>
                      <div className="text-2xl font-bold text-white">
                        {leagueAverageData[key as keyof typeof leagueAverageData]}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="block md:hidden space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {['0.5+', '1.5+', '2.5+', '3.5+', '4.5+', '5.5+'].map((key) => (
                  <div key={key} className="glass-effect rounded-lg p-4 text-center">
                    <div className="text-xs text-crypto-light font-medium">{key}</div>
                    <div className="text-lg font-bold text-white">
                      {leagueAverageData[key as keyof typeof leagueAverageData]}%
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-4">
                {['BTS', 'CS'].map((key) => (
                  <div key={key} className="glass-effect rounded-lg p-4 text-center">
                    <div className="text-xs text-crypto-light font-medium">{key}</div>
                    <div className="text-lg font-bold text-white">
                      {leagueAverageData[key as keyof typeof leagueAverageData]}%
                    </div>
                  </div>
                ))}
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
        <div className="space-y-6">
          {/* Model Toggle */}
          <Card className="glass-effect border-crypto-steel/30 crypto-shadow">
            <CardHeader>
              <CardTitle className="text-center text-2xl text-white flex items-center justify-center gap-3">
                <Shield className="h-6 w-6 text-crypto-steel" />
                Modelo de Previsão Avançado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-6 mb-4">
                <span className={`text-lg font-semibold ${!useDixonColes ? 'text-crypto-steel' : 'text-crypto-light/60'}`}>
                  Poisson
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUseDixonColes(!useDixonColes)}
                  className="p-2 hover:bg-crypto-steel/20"
                >
                  {useDixonColes ? (
                    <ToggleRight className="h-10 w-10 text-crypto-steel" />
                  ) : (
                    <ToggleLeft className="h-10 w-10 text-crypto-light/60" />
                  )}
                </Button>
                <span className={`text-lg font-semibold ${useDixonColes ? 'text-crypto-steel' : 'text-crypto-light/60'}`}>
                  Avançado
                </span>
              </div>
              <div className="text-center glass-effect p-4 rounded-lg">
                <p className="text-sm text-crypto-light">
                  {useDixonColes 
                    ? 'Modelo com inteligência artificial e correções para placares baixos + vantagem de casa'
                    : 'Modelo clássico baseado na distribuição estatística de Poisson'
                  }
                </p>
              </div>
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
