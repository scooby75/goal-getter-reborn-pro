
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, Clock, Calendar } from 'lucide-react';
import { useHeadToHead, HeadToHeadMatch } from '@/hooks/useHeadToHead';

interface HeadToHeadCardProps {
  homeTeam: string;
  awayTeam: string;
}

export const HeadToHeadCard: React.FC<HeadToHeadCardProps> = ({
  homeTeam,
  awayTeam,
}) => {
  const { data: matches, isLoading, error } = useHeadToHead();

  if (!homeTeam && !awayTeam) {
    return null;
  }

  const getRelevantMatches = (): HeadToHeadMatch[] => {
    if (!matches) return [];

    return matches
      .filter((match) => {
        if (homeTeam && awayTeam) {
          // Confrontos diretos entre as duas equipes
          return (
            (match.Team_Home === homeTeam && match.Team_Away === awayTeam) ||
            (match.Team_Home === awayTeam && match.Team_Away === homeTeam)
          );
        } else {
          // Últimos jogos da equipe selecionada
          const selectedTeam = homeTeam || awayTeam;
          return match.Team_Home === selectedTeam || match.Team_Away === selectedTeam;
        }
      })
      .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
      .slice(0, 10); // Últimos 10 confrontos
  };

  const relevantMatches = getRelevantMatches();

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getMatchResult = (match: HeadToHeadMatch, teamToCheck?: string): string => {
    if (!teamToCheck) return '';
    
    const [homeScore, awayScore] = match.Score.split('-').map(s => parseInt(s.trim()));
    
    if (match.Team_Home === teamToCheck) {
      if (homeScore > awayScore) return 'V';
      if (homeScore < awayScore) return 'D';
      return 'E';
    } else {
      if (awayScore > homeScore) return 'V';
      if (awayScore < homeScore) return 'D';
      return 'E';
    }
  };

  const getResultColor = (result: string): string => {
    switch (result) {
      case 'V': return 'text-green-600 bg-green-50 border-green-200';
      case 'D': return 'text-red-600 bg-red-50 border-red-200';
      case 'E': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (error) {
    return (
      <Card className="bg-white/95 backdrop-blur-sm border-red-200 shadow-lg z-10">
        <CardHeader className="pb-3">
          <CardTitle className="text-center text-lg text-red-600 flex items-center justify-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Erro ao Carregar Confrontos
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-red-600 text-center text-sm">
            Não foi possível carregar os dados dos confrontos.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-white/95 backdrop-blur-sm border-blue-200 shadow-lg z-10">
        <CardHeader className="pb-3">
          <CardTitle className="text-center text-lg text-gray-800 flex items-center justify-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Últimos Confrontos
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
            <span className="text-blue-600 text-sm">Carregando confrontos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getCardTitle = (): string => {
    if (homeTeam && awayTeam) {
      return `Histórico: ${homeTeam} vs ${awayTeam}`;
    }
    return `Últimos Jogos: ${homeTeam || awayTeam}`;
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg z-10">
      <CardHeader className="pb-3">
        <CardTitle className="text-center text-lg text-gray-800 flex items-center justify-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          {getCardTitle()}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {relevantMatches.length === 0 ? (
          <div className="text-center py-4">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-600 text-sm">
              Nenhum confronto encontrado para as equipes selecionadas.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {relevantMatches.map((match, index) => {
              const selectedTeam = homeTeam && awayTeam ? undefined : (homeTeam || awayTeam);
              const result = selectedTeam ? getMatchResult(match, selectedTeam) : '';
              
              return (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-xs text-gray-600 font-medium">
                        {formatDate(match.Date)}
                      </span>
                    </div>
                    {result && (
                      <div className={`px-2 py-1 rounded text-xs font-bold border ${getResultColor(result)}`}>
                        {result}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-800 mb-1">
                        {match.Team_Home} vs {match.Team_Away}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span>
                          <strong>HT:</strong> {match.HT_Score || 'N/A'}
                        </span>
                        <span>
                          <strong>FT:</strong> {match.Score}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {relevantMatches.length > 0 && (
              <div className="text-center mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Mostrando {relevantMatches.length} últimos confrontos
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
