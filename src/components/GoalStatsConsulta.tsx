import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, ToggleLeft, ToggleRight, Shield, TrendingUp, Search, Check } from 'lucide-react';
import { useGoalStats } from '@/hooks/useGoalStats';
import { StatsDisplay } from './StatsDisplay';
import { FilteredLeagueAverage } from './FilteredLeagueAverage';
import { LeagueAverageDisplay } from './LeagueAverageDisplay';
import { ProbableScores } from './ProbableScores';
import { DixonColesScores } from './DixonColesScores';
import { GoalMomentCard } from './GoalMomentCard';
import { HeadToHeadCard } from './HeadToHeadCard';
import { RecentGamesCard } from './RecentGamesCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
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
          onFocus={() => {
            setFocused(true);
            if (value.length > 1) {
              const normalizedInput = normalizeText(value);
              const filtered = options
                .filter(option => normalizeText(option).includes(normalizedInput))
                .slice(0, 5);
              setSuggestions(filtered);
            }
          }}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder={placeholder}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
        {focused && suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex items-center"
                onMouseDown={() => handleSelectSuggestion(suggestion)}
              >
                <Check className="h-4 w-4 mr-2 text-green-500 opacity-0 group-hover:opacity-100" />
                <span>{suggestion}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SearchableSelect = ({
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
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options
    .filter(option => normalizeText(option).includes(normalizeText(searchTerm)))
    .sort((a, b) => a.localeCompare(b));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionSelect = (option: string) => {
    onValueChange(option);
    setOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setOpen(!open);
            setSearchTerm('');
          }}
          className="w-full flex items-center justify-between px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          <span className={value ? "text-gray-900" : "text-gray-500"}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 text-gray-400" />
        </button>

        {open && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar time..."
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-2 text-gray-500 text-center text-sm">
                  Nenhum time encontrado
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleOptionSelect(option)}
                    className={cn(
                      "w-full flex items-center px-4 py-2 text-left hover:bg-gray-50 focus:outline-none text-sm",
                      value === option ? "bg-blue-50 text-blue-600" : "text-gray-900"
                    )}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 flex-shrink-0",
                        value === option ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>{option}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const GoalStatsConsulta = () => {
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
    <div className="space-y-4 p-3 min-h-screen gradient-crypto">
      {/* Team Selection - Versão mobile com inputs de busca */}
      <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-center text-xl text-gray-800 flex items-center justify-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Seleção de Equipes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-4">
            {/* Versão mobile - inputs com autocompletar */}
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

            {/* Versão desktop - mantém os dropdowns */}
            <div className="hidden md:grid md:grid-cols-2 gap-4">
              <SearchableSelect
                value={selectedHomeTeam}
                onValueChange={setSelectedHomeTeam}
                options={homeTeams}
                placeholder="Selecione o time da casa"
                label={`Time da Casa (${homeTeams.length} times)`}
              />
              
              <SearchableSelect
                value={selectedAwayTeam}
                onValueChange={setSelectedAwayTeam}
                options={awayTeams}
                placeholder="Selecione o time visitante"
                label={`Time Visitante (${awayTeams.length} times)`}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Restante do código permanece igual */}
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

      {(selectedHomeTeam || selectedAwayTeam) && (
        <LeagueAverageDisplay 
          homeStats={selectedHomeStats}
          awayStats={selectedAwayStats}
          leagueAverages={goalStatsData.leagueAverages}
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
