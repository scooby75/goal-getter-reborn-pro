import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useGoalStats } from '@/hooks/useGoalStats';
import { StatsDisplay } from './StatsDisplay';
import { FilteredLeagueAverage } from './FilteredLeagueAverage';
import { LeagueAverageDisplay } from './LeagueAverageDisplay';
import { ImprovedTeamSearch } from './ImprovedTeamSearch';
import { LastUpdateDisplay } from './LastUpdateDisplay';
import { AuthGuard } from './AuthGuard';
import { Button } from '@/components/ui/button';

export const GoalStatsConsulta = () => {
  console.log('GoalStatsConsulta component rendering');
  
  const [selectedHomeTeam, setSelectedHomeTeam] = useState<string>('');
  const [selectedAwayTeam, setSelectedAwayTeam] = useState<string>('');
  const [debugExpanded, setDebugExpanded] = useState(true);
  
  const { goalStatsData, isLoading, error } = useGoalStats();

  console.log('GoalStatsConsulta - Current state:', {
    isLoading,
    error: error?.message,
    homeStatsCount: goalStatsData?.homeStats?.length || 0,
    awayStatsCount: goalStatsData?.awayStats?.length || 0,
    overallStatsCount: goalStatsData?.overallStats?.length || 0
  });

  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    window.location.reload();
  };

  return (
    <AuthGuard requireApproval>
      <div className="space-y-6">
        {/* Last Update Display */}
        <LastUpdateDisplay />

        {/* Enhanced Debug Information */}
        <Card className="shadow-lg bg-blue-50 border-2 border-blue-200">
          <CardHeader className="cursor-pointer" onClick={() => setDebugExpanded(!debugExpanded)}>
            <CardTitle className="text-center text-lg text-blue-800 flex items-center justify-center gap-2">
              🔍 Debug Information 
              <span className="text-sm">({debugExpanded ? 'Click to collapse' : 'Click to expand'})</span>
            </CardTitle>
          </CardHeader>
          {debugExpanded && (
            <CardContent>
              <div className="space-y-3">
                {/* Status Indicators */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    ) : error ? (
                      <WifiOff className="h-4 w-4 text-red-600" />
                    ) : (
                      <Wifi className="h-4 w-4 text-green-600" />
                    )}
                    <span className="font-semibold">
                      Status: {isLoading ? 'Loading...' : error ? 'Error' : 'Connected'}
                    </span>
                  </div>
                  
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>

                {/* Detailed Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p><strong>Loading:</strong> <span className={isLoading ? 'text-orange-600' : 'text-green-600'}>{isLoading ? 'Yes' : 'No'}</span></p>
                    <p><strong>Error:</strong> <span className={error ? 'text-red-600' : 'text-green-600'}>{error ? error.message : 'None'}</span></p>
                    <p><strong>Home Stats:</strong> <span className="font-mono">{goalStatsData?.homeStats?.length || 0} teams</span></p>
                    <p><strong>Away Stats:</strong> <span className="font-mono">{goalStatsData?.awayStats?.length || 0} teams</span></p>
                  </div>
                  
                  <div className="space-y-2">
                    <p><strong>Overall Stats:</strong> <span className="font-mono">{goalStatsData?.overallStats?.length || 0} teams</span></p>
                    <p><strong>League Averages:</strong> <span className="font-mono">{goalStatsData?.leagueAverages?.length || 0} leagues</span></p>
                    <p><strong>Data Status:</strong> 
                      <span className={goalStatsData?.homeStats?.length > 0 ? 'text-green-600' : 'text-red-600'}>
                        {goalStatsData?.homeStats?.length > 0 ? ' ✅ Available' : ' ❌ No Data'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Network Troubleshooting Hints */}
                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">🚨 Troubleshooting Tips:</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• Check your internet connection</li>
                      <li>• GitHub might be temporarily unavailable</li>
                      <li>• Your browser might be blocking the request</li>
                      <li>• Try refreshing the page or clearing browser cache</li>
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Display error or loading state */}
        {error && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center max-w-md">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
              <h3 className="text-xl font-semibold text-red-600 mb-2">Erro de Conectividade</h3>
              <p className="text-red-600 mb-4">Erro ao carregar dados: {error.message}</p>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Possíveis soluções:</p>
                <ul className="text-left space-y-1">
                  <li>• Verifique sua conexão com a internet</li>
                  <li>• Aguarde alguns minutos e tente novamente</li>
                  <li>• Recarregue a página (F5)</li>
                  <li>• Limpe o cache do navegador</li>
                </ul>
              </div>
              <Button onClick={handleRefresh} className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 text-lg">Carregando dados das equipes...</p>
              <p className="text-sm text-gray-500 mt-2">
                Conectando ao servidor... Isso pode levar alguns segundos.
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
                    <p className="text-yellow-700 mb-4">
                      Não foram encontrados dados de equipes. A base de dados pode estar vazia ou em processo de atualização.
                    </p>
                    <p className="text-sm text-yellow-600 mb-4">
                      Aguarde alguns minutos e tente novamente, ou entre em contato com o administrador.
                    </p>
                    <Button onClick={handleRefresh} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Recarregar Dados
                    </Button>
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
