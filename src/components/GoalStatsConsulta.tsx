import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, ToggleLeft, ToggleRight, Shield, TrendingUp } from 'lucide-react';
import { useGoalStats } from '@/hooks/useGoalStats';
import { StatsDisplay } from './StatsDisplay';
import { FilteredLeagueAverage } from './FilteredLeagueAverage';
import { SearchableSelect } from './SearchableSelect';
import { ProbableScores } from './ProbableScores';
import { DixonColesScores } from './DixonColesScores';
import { GoalMomentCard } from './GoalMomentCard';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'goalStatsFilters';

export const GoalStatsConsulta = () => {
  console.log('GoalStatsConsulta component rendering');
  
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

  const [selectedPrintTeam, setSelectedPrintTeam] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedFilters = localStorage.getItem(STORAGE_KEY);
      return savedFilters ? JSON.parse(savedFilters).printTeam : '';
    }
    return '';
  });

  const [useDixonColes, setUseDixonColes] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedPreference = localStorage.getItem('scorePredictionModel');
      return savedPreference === 'dixon-coles';
    }
    return true;
  });
  
  const { goalStatsData, isLoading, error } = useGoalStats();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        homeTeam: selectedHomeTeam,
        awayTeam: selectedAwayTeam,
        printTeam: selectedPrintTeam
      }));
    }
  }, [selectedHomeTeam, selectedAwayTeam, selectedPrintTeam]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('scorePredictionModel', useDixonColes ? 'dixon-coles' : 'poisson');
    }
  }, [useDixonColes]);

  if (error) {
    console.error('Error in GoalStatsConsulta:', error);
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center bg-white/95 backdrop-blur-sm border border-red-200 p-6 rounded-lg shadow-lg w-full max-w-6xl mx-auto">
          <AlertCircle className="h-8 w-8 mx-auto mb-3 text-red-500" />
          <p className="text-red-600 font-semibold text-sm">Erro ao carregar dados: {error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center bg-white/95 backdrop-blur-sm border border-blue-200 p-6 rounded-lg shadow-lg w-full max-w-6xl mx-auto">
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

  const printTeams = [...homeTeams, ...awayTeams]
    .filter((value, index, self) => self.indexOf(value) === index)
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

  const selectedHomeGoalMoments = goalStatsData.homeGoalMoments?.find(
    team => team.Team === selectedHomeTeam
  );
  const selectedAwayGoalMoments = goalStatsData.awayGoalMoments?.find(
    team => team.Team === selectedAwayTeam
  );

  return (
    <div className="space-y-4 p-3 min-h-screen gradient-crypto max-w-6xl mx-auto">
      {/* Team Selection */}
      <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg relative z-20 w-full">
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
                label={`Time da Casa (${homeTeams.length} times)`}
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
                label={`Time Visitante (${awayTeams.length} times)`}
                className="z-50"
                dropdownClassName="z-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {shouldShowDifferentLeaguesWarning() && (
        <Card className="bg-white/95 backdrop-blur-sm border-red-300 shadow-lg z-10 w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-center text-lg text-red-600 flex items-center justify-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Ligas Diferentes Detectadas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center space-y-2">
              <p className="text-gray-800 font-semibold text-sm">Os times selecionados pertencem a ligas diferentes.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                  <p className="text-gray-600 text-xs font-medium">Time da Casa</p>
                  <p className="text-gray-800 font-bold text-sm">{homeTeamLeague}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                  <p className="text-gray-600 text-xs font-medium">Time Visitante</p>
                  <p className="text-gray-800 font-bold text-sm">{awayTeamLeague}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {shouldShowLeagueAverage() && leagueAverageData && (
        <Card className="bg-white/95 backdrop-blur-sm border-blue-200 shadow-lg z-10 w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-center text-lg text-gray-800 flex items-center justify-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Média da Liga: {leagueAverageData.League_Name}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="hidden md:block overflow-x-auto">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-8 gap-3 text-center">
                  {['0.5+', '1.5+', '2.5+', '3.5+', '4.5+', '5.5+', 'BTS', 'CS'].map((key, index) => (
                    <div key={key} className="space-y-1">
                      <div className="text-xs text-gray-600 font-medium">{key}</div>
                      <div className="text-lg font-bold text-gray-800">
                        {leagueAverageData[key as keyof typeof leagueAverageData]}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="block md:hidden space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {['0.5+', '1.5+', '2.5+', '3.5+', '4.5+', '5.5+'].map((key) => (
                  <div key={key} className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
                    <div className="text-xs text-gray-600 font-medium">{key}</div>
                    <div className="text-sm font-bold text-gray-800">
                      {leagueAverageData[key as keyof typeof leagueAverageData]}%
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-3">
                {['BTS', 'CS'].map((key) => (
                  <div key={key} className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
                    <div className="text-xs text-gray-600 font-medium">{key}</div>
                    <div className="text-sm font-bold text-gray-800">
                      {leagueAverageData[key as keyof typeof leagueAverageData]}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Média dos Times Selecionados - Novo Card */}
      {(selectedHomeTeam || selectedAwayTeam) && (
        <Card className="bg-white/95 backdrop-blur-sm border-blue-200 shadow-lg z-10 w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-center text-lg text-gray-800 flex items-center justify-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Média dos Times Selecionados
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-8 gap-3 text-center">
                <div className="space-y-1">
                  <div className="text-xs text-gray-600 font-medium">GP</div>
                  <div className="text-lg font-bold text-gray-800">
                    {selectedHomeStats?.GP || selectedAwayStats?.GP || '-'}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-600 font-medium">Avg</div>
                  <div className="text-lg font-bold text-gray-800">
                    {selectedHomeStats?.Avg || selectedAwayStats?.Avg || '-'}
                  </div>
                </div>
                {['0.5+', '1.5+', '2.5+', '3.5+', '4.5+', '5.5+'].map((key) => (
                  <div key={key} className="space-y-1">
                    <div className="text-xs text-gray-600 font-medium">{key}</div>
                    <div className="text-lg font-bold text-gray-800">
                      {selectedHomeStats?.[key as keyof typeof selectedHomeStats] || 
                       selectedAwayStats?.[key as keyof typeof selectedAwayStats] || '-'}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="block md:hidden mt-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-600 font-medium">GP</div>
                  <div className="text-sm font-bold text-gray-800">
                    {selectedHomeStats?.GP || selectedAwayStats?.GP || '-'}
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-600 font-medium">Avg</div>
                  <div className="text-sm font-bold text-gray-800">
                    {selectedHomeStats?.Avg || selectedAwayStats?.Avg || '-'}
                  </div>
                </div>
                {['0.5+', '1.5+', '2.5+', '3.5+', '4.5+', '5.5+'].map((key) => (
                  <div key={key} className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
                    <div className="text-xs text-gray-600 font-medium">{key}</div>
                    <div className="text-sm font-bold text-gray-800">
                      {selectedHomeStats?.[key as keyof typeof selectedHomeStats] || 
                       selectedAwayStats?.[key as keyof typeof selectedAwayStats] || '-'}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
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
        <div className="space-y-4 w-full">
          {/* Model Toggle */}
          <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg z-10 w-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-center text-lg text-gray-800 flex items-center justify-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Modelo de Previsão Avançado
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-center gap-4 mb-3">
                <span className={`text-sm font-semibold ${!useDixonColes ? 'text-blue-600' : 'text-gray-400'}`}>
                  Poisson
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUseDixonColes(!useDixonColes)}
                  className="p-1 hover:bg-gray-100"
                >
                  {useDixonColes ? (
                    <ToggleRight className="h-8 w-8 text-blue-600" />
                  ) : (
                    <ToggleLeft className="h-8 w-8 text-gray-400" />
                  )}
                </Button>
                <span className={`text-sm font-semibold ${useDixonColes ? 'text-blue-600' : 'text-gray-400'}`}>
                  Avançado
                </span>
              </div>
              <div className="text-center bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-xs text-gray-700">
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
