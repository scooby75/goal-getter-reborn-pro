import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { useGoalStats } from '@/hooks/useGoalStats';
import { StatsDisplay } from './StatsDisplay';
import { FilteredLeagueAverage } from './FilteredLeagueAverage';
import { LeagueAverageDisplay } from './LeagueAverageDisplay';
import { ImprovedTeamSearch } from './ImprovedTeamSearch';
import { LastUpdateDisplay } from './LastUpdateDisplay';
import { AuthGuard } from './AuthGuard';

export const GoalStatsConsulta = () => {
  console.log('GoalStatsConsulta component rendering');
  
  const [selectedHomeTeam, setSelectedHomeTeam] = useState<string>('');
  const [selectedAwayTeam, setSelectedAwayTeam] = useState<string>('');
  
  const { goalStatsData, isLoading, error } = useGoalStats();

  console.log('GoalStatsConsulta - Current state:', {
    isLoading,
    error: error?.message,
    homeStatsCount: goalStatsData?.homeStats?.length || 0,
    awayStatsCount: goalStatsData?.awayStats?.length || 0,
    overallStatsCount: goalStatsData?.overallStats?.length || 0
  });

  return (
    <AuthGuard requireApproval>
      <div className="space-y-6">
        {/* Last Update Display */}
        <LastUpdateDisplay />

        {/* Debug Information */}
        <Card className="shadow-lg bg-blue-50">
          <CardHeader>
            <CardTitle className="text-center text-lg text-blue-800">
              🔍 Debug Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
              <p><strong>Error:</strong> {error ? error.message : 'None'}</p>
              <p><strong>Home Stats:</strong> {goalStatsData?.homeStats?.length || 0} teams</p>
              <p><strong>Away Stats:</strong> {goalStatsData?.awayStats?.length || 0} teams</p>
              <p><strong>Overall Stats:</strong> {goalStatsData?.overallStats?.length || 0} teams</p>
              <p><strong>League Averages:</strong> {goalStatsData?.leagueAverages?.length || 0} leagues</p>
            </div>
          </CardContent>
        </Card>

        {/* Display error or loading state */}
        {error && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
              <p className="text-red-600">Erro ao carregar dados: {error.message}</p>
              <p className="text-sm text-gray-500 mt-2">
                Verifique sua conexão com a internet e tente novamente
              </p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Carregando dados das equipes...</p>
              <p className="text-sm text-gray-500 mt-2">
                Isso pode levar alguns segundos...
              </p>
            </div>
          </div>
        )}

        {!error && !isLoading && goalStatsData && (
          <>
            {/* Show message if no data is available */}
            {(!goalStatsData.homeStats || goalStatsData.homeStats.length === 0) && (
              <Card className="shadow-lg bg-yellow-50 border-yellow-200">
                <CardHeader>
                  <CardTitle className="text-center text-xl text-yellow-800">
                    ⚠️ Nenhum Dado Disponível
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-yellow-700">
                      Não foram encontrados dados de equipes. A base de dados pode estar vazia ou em processo de atualização.
                    </p>
                    <p className="text-sm text-yellow-600 mt-2">
                      Aguarde alguns minutos e tente novamente, ou entre em contato com o administrador.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Team Selection - only show if we have data */}
            {goalStatsData.homeStats && goalStatsData.homeStats.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-center text-2xl text-gray-800">
                    Selecione as Equipes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ImprovedTeamSearch
                      value={selectedHomeTeam}
                      onValueChange={setSelectedHomeTeam}
                      options={goalStatsData.homeStats
                        .map(team => team.Team)
                        .filter(teamName => teamName && teamName.trim() !== '')
                        .sort()}
                      placeholder="Selecione o time da casa"
                      label="Time da Casa"
                    />
                    
                    <ImprovedTeamSearch
                      value={selectedAwayTeam}
                      onValueChange={setSelectedAwayTeam}
                      options={goalStatsData.awayStats
                        .map(team => team.Team)
                        .filter(teamName => teamName && teamName.trim() !== '')
                        .sort()}
                      placeholder="Selecione o time visitante"
                      label="Time Visitante"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rest of the existing component logic */}
            {(selectedHomeTeam || selectedAwayTeam) && (
              <>
                {/* Verificar as ligas dos times selecionados */}
                {(() => {
                  const getTeamLeague = (teamName: string, isHome: boolean) => {
                    const stats = isHome 
                      ? goalStatsData.homeStats.find(team => team.Team === teamName)
                      : goalStatsData.awayStats.find(team => team.Team === teamName);
                    return stats?.League_Name;
                  };

                  const homeTeamLeague = selectedHomeTeam ? getTeamLeague(selectedHomeTeam, true) : null;
                  const awayTeamLeague = selectedAwayTeam ? getTeamLeague(selectedAwayTeam, false) : null;

                  const shouldShowDifferentLeaguesWarning = () => {
                    return selectedHomeTeam && selectedAwayTeam && 
                           homeTeamLeague && awayTeamLeague && 
                           homeTeamLeague !== awayTeamLeague;
                  };

                  const shouldShowLeagueAverage = () => {
                    if (!selectedHomeTeam && !selectedAwayTeam) return false;
                    if (selectedHomeTeam && selectedAwayTeam) {
                      return homeTeamLeague === awayTeamLeague && homeTeamLeague;
                    }
                    return true;
                  };

                  const getLeagueAverageData = () => {
                    const targetLeague = homeTeamLeague || awayTeamLeague;
                    if (!targetLeague) return null;
                    
                    return goalStatsData.leagueAverages.find(
                      league => league.League_Name === targetLeague
                    );
                  };

                  const leagueAverageData = getLeagueAverageData();

                  return (
                    <>
                      {/* Aviso de Ligas Diferentes */}
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

                      {/* Média da Liga */}
                      {shouldShowLeagueAverage() && leagueAverageData && (
                        <Card className="shadow-lg bg-gradient-to-r from-blue-500 to-green-500 text-white">
                          <CardHeader>
                            <CardTitle className="text-center text-xl">
                              📊 Média da Liga: {leagueAverageData.League_Name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {/* Desktop Table */}
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
                            
                            {/* Mobile Cards */}
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
                      <LeagueAverageDisplay 
                        homeStats={goalStatsData.homeStats.find(team => team.Team === selectedHomeTeam)}
                        awayStats={goalStatsData.awayStats.find(team => team.Team === selectedAwayTeam)}
                        leagueAverages={goalStatsData.leagueAverages}
                        selectedHomeTeam={selectedHomeTeam}
                        selectedAwayTeam={selectedAwayTeam}
                      />

                      {/* Filtered League Average */}
                      <FilteredLeagueAverage 
                        homeStats={goalStatsData.homeStats.find(team => team.Team === selectedHomeTeam)}
                        awayStats={goalStatsData.awayStats.find(team => team.Team === selectedAwayTeam)}
                        selectedHomeTeam={selectedHomeTeam}
                        selectedAwayTeam={selectedAwayTeam}
                      />

                      {/* Stats Display */}
                      <StatsDisplay 
                        homeTeam={selectedHomeTeam}
                        awayTeam={selectedAwayTeam}
                        homeStats={goalStatsData.homeStats.find(team => team.Team === selectedHomeTeam)}
                        awayStats={goalStatsData.awayStats.find(team => team.Team === selectedAwayTeam)}
                      />
                    </>
                  );
                })()}
              </>
            )}
          </>
        )}
      </div>
    </AuthGuard>
  );
};
