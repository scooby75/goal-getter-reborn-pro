// src/components/GoalStatsConsulta.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, ToggleLeft, ToggleRight, Shield, TrendingUp, Search, Check, Share2 } from 'lucide-react';
import { useGoalStats } from '@/hooks/useGoalStats';
import { StatsDisplay } from './StatsDisplay';
import { FilteredLeagueAverage } from './FilteredLeagueAverage';
import { LeagueAverageDisplay } from './LeagueAverageDisplay';
import { ProbableScores } from './ProbableScores';
import { DixonColesScores } from './DixonColesScores';
import { GoalMomentCard } from './GoalMomentCard';
import { HeadToHeadCard } from './HeadToHeadCard';
import { RecentGamesCard } from './RecentGamesCard';
import { ScoreFrequencyCard } from './ScoreFrequencyCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { saveFiltersToUrl, getFiltersFromUrl } from '@/utils/urlParams';

const STORAGE_KEY = 'goalStatsFilters';

const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
};

const TeamSearchInput = ({ 
  value, 
  onValueChange, 
  options, 
  placeholder, 
  label,
  className 
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder: string;
  label: string;
  className?: string;
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    onValueChange(input);
    
    if (input.length > 1) {
      const normalizedInput = normalizeText(input);
      const filtered = options
        .filter(option => normalizeText(option).includes(normalizedInput))
        .slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    onValueChange(suggestion);
    setSuggestions([]);
  };

  return (
    <div className={cn("relative", className)}>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
        {isFocused && suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex items-center"
                onMouseDown={() => handleSelectSuggestion(suggestion)}
              >
                <span>{suggestion}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ShareButton = ({ homeTeam, awayTeam }: { homeTeam: string; awayTeam: string }) => {
  const handleShare = async () => {
    try {
      const currentUrl = window.location.href;
      
      if (navigator.share) {
        await navigator.share({
          title: `Estatísticas: ${homeTeam || 'Time da Casa'} vs ${awayTeam || 'Time Visitante'}`,
          text: `Confira as estatísticas entre ${homeTeam || 'time da casa'} e ${awayTeam || 'time visitante'}`,
          url: currentUrl
        });
      } else {
        await navigator.clipboard.writeText(currentUrl);
        alert('Link copiado para a área de transferência!');
      }
    } catch (err) {
      console.error('Erro ao compartilhar:', err);
    }
  };

  return (
    <Button 
      onClick={handleShare}
      variant="outline"
      className="gap-2"
    >
      <Share2 className="h-4 w-4" />
      Compartilhar
    </Button>
  );
};

export const GoalStatsConsulta = () => {
  const [selectedHomeTeam, setSelectedHomeTeam] = useState<string>('');
  const [selectedAwayTeam, setSelectedAwayTeam] = useState<string>('');
  const [selectedPrintTeam, setSelectedPrintTeam] = useState<string>('');
  const [useDixonColes, setUseDixonColes] = useState<boolean>(true);
  
  const { goalStatsData, isLoading, error } = useGoalStats();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlFilters = getFiltersFromUrl();
      
      if (urlFilters.homeTeam) setSelectedHomeTeam(urlFilters.homeTeam);
      if (urlFilters.awayTeam) setSelectedAwayTeam(urlFilters.awayTeam);
      if (urlFilters.printTeam) setSelectedPrintTeam(urlFilters.printTeam);
      setUseDixonColes(urlFilters.model === 'dixon-coles');

      if (!urlFilters.homeTeam && !urlFilters.awayTeam) {
        const savedFilters = localStorage.getItem(STORAGE_KEY);
        if (savedFilters) {
          const { homeTeam, awayTeam, printTeam } = JSON.parse(savedFilters);
          setSelectedHomeTeam(homeTeam || '');
          setSelectedAwayTeam(awayTeam || '');
          setSelectedPrintTeam(printTeam || '');
        }
      }
    }
  }, []);

  useEffect(() => {
    saveFiltersToUrl({
      homeTeam: selectedHomeTeam,
      awayTeam: selectedAwayTeam,
      printTeam: selectedPrintTeam,
      model: useDixonColes ? 'dixon-coles' : 'poisson'
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        homeTeam: selectedHomeTeam,
        awayTeam: selectedAwayTeam,
        printTeam: selectedPrintTeam
      }));
    }
  }, [selectedHomeTeam, selectedAwayTeam, selectedPrintTeam, useDixonColes]);

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

  const homeTeams = goalStatsData?.homeStats
    ?.map(team => team.Team)
    ?.filter(teamName => teamName && teamName.trim() !== '')
    ?.sort() || [];
    
  const awayTeams = goalStatsData?.awayStats
    ?.map(team => team.Team)
    ?.filter(teamName => teamName && teamName.trim() !== '')
    ?.sort() || [];

  const printTeams = [...new Set([...homeTeams, ...awayTeams])].sort();

  const selectedHomeStats = goalStatsData?.homeStats?.find(team => team.Team === selectedHomeTeam);
  const selectedAwayStats = goalStatsData?.awayStats?.find(team => team.Team === selectedAwayTeam);

  const getTeamLeague = (teamName: string, isHome: boolean) => {
    const stats = isHome 
      ? goalStatsData?.homeStats?.find(team => team.Team === teamName)
      : goalStatsData?.awayStats?.find(team => team.Team === teamName);
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
    
    return goalStatsData?.leagueAverages?.find(
      league => league.League_Name === targetLeague
    );
  };

  const leagueAverageData = getLeagueAverageData();

  const selectedHomeGoalMoments = goalStatsData?.homeGoalMoments?.find(
    team => team.Team === selectedHomeTeam
  );
  const selectedAwayGoalMoments = goalStatsData?.awayGoalMoments?.find(
    team => team.Team === selectedAwayTeam
  );

  return (
    <div className="space-y-4 p-3 min-h-screen gradient-crypto">
      <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Seleção de Equipes
            </CardTitle>
            {(selectedHomeTeam || selectedAwayTeam) && (
              <ShareButton homeTeam={selectedHomeTeam} awayTeam={selectedAwayTeam} />
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-4">
            <div className="md:hidden space-y-4">
              <TeamSearchInput
                value={selectedHomeTeam}
                onValueChange={setSelectedHomeTeam}
                options={homeTeams}
                placeholder="Digite o time da casa"
                label={`Time da Casa (${homeTeams.length} times)`}
              />
              
              <TeamSearchInput
                value={selectedAwayTeam}
                onValueChange={setSelectedAwayTeam}
                options={awayTeams}
                placeholder="Digite o time visitante"
                label={`Time Visitante (${awayTeams.length} times)`}
              />
            </div>

            <div className="hidden md:block">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Time da Casa ({homeTeams.length} times)
                  </label>
                  <select
                    value={selectedHomeTeam}
                    onChange={(e) => setSelectedHomeTeam(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Selecione o time da casa</option>
                    {homeTeams.map(team => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Time Visitante ({awayTeams.length} times)
                  </label>
                  <select
                    value={selectedAwayTeam}
                    onChange={(e) => setSelectedAwayTeam(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Selecione o time visitante</option>
                    {awayTeams.map(team => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {shouldShowDifferentLeaguesWarning() && (
        <Card className="bg-white/95 backdrop-blur-sm border-red-300 shadow-lg">
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
        <Card className="bg-white/95 backdrop-blur-sm border-blue-200 shadow-lg">
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
                  {['0.5+', '1.5+', '2.5+', '3.5+', '4.5+', '5.5+', 'BTS', 'CS'].map((key) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ScoreFrequencyCard 
          type="HT" 
          title="Frequência Placar HT (Liga)" 
          maxItems={8} 
        />
        <ScoreFrequencyCard 
          type="FT" 
          title="Frequência Placar FT (Liga)" 
          maxItems={6} 
        />
      </div>

      {(selectedHomeTeam || selectedAwayTeam) && (
        <LeagueAverageDisplay 
          homeStats={selectedHomeStats}
          awayStats={selectedAwayStats}
          leagueAverages={goalStatsData?.leagueAverages || []}
          selectedHomeTeam={selectedHomeTeam}
          selectedAwayTeam={selectedAwayTeam}
        />
      )}

      {(selectedHomeTeam || selectedAwayTeam) && (
        <FilteredLeagueAverage 
          homeStats={selectedHomeStats}
          awayStats={selectedAwayStats}
          selectedHomeTeam={selectedHomeTeam}
          selectedAwayTeam={selectedAwayTeam}
        />
      )}

      {(selectedHomeTeam || selectedAwayTeam) && (
        <StatsDisplay 
          homeTeam={selectedHomeTeam}
          awayTeam={selectedAwayTeam}
          homeStats={selectedHomeStats}
          awayStats={selectedAwayStats}
        />
      )}

      {(selectedHomeTeam || selectedAwayTeam) && (
        <HeadToHeadCard
          homeTeam={selectedHomeTeam}
          awayTeam={selectedAwayTeam}
        />
      )}

      {(selectedHomeTeam || selectedAwayTeam) && (
        <RecentGamesCard 
          homeTeam={selectedHomeTeam} 
          awayTeam={selectedAwayTeam} 
        />
      )}
      
      {(selectedHomeTeam || selectedAwayTeam) && (
        <GoalMomentCard
          homeTeam={selectedHomeTeam}
          awayTeam={selectedAwayTeam}
          homeGoalMoments={selectedHomeGoalMoments}
          awayGoalMoments={selectedAwayGoalMoments}
        />
      )}

      {selectedHomeStats && selectedAwayStats && (
        <div className="space-y-4">
          <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg">
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
