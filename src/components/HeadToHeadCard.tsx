import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, Clock, Calendar, Home, Plane } from 'lucide-react';
import { useHeadToHead, HeadToHeadMatch } from '@/hooks/useHeadToHead';

interface HeadToHeadCardProps {
  team1: string;
  team2: string;
}

export const HeadToHeadCard: React.FC<HeadToHeadCardProps> = ({ team1, team2 }) => {
  const { data: matches, isLoading, error, isError } = useHeadToHead(team1, team2);

  if (!team1 || !team2) return null;

  const formatDate = (dateString: string): string => {
    // Retorna data no formato dd/mm/aaaa - já no CSV
    return dateString;
  };

  const formatScore = (score: string): string => {
    if (!score) return '';
    const parts = score.trim().split(/\s*-\s*/);
    if (parts.length !== 2) return score;
    return `${parts[0]} - ${parts[1]}`;
  };

  const getMatchResult = (match: HeadToHeadMatch, teamToCheck: string): string => {
    if (!match.Score || !match.Score.includes('-')) return '';

    try {
      const [homeScoreStr, awayScoreStr] = match.Score.trim().split(/\s*-\s*/);
      const homeScore = parseInt(homeScoreStr);
      const awayScore = parseInt(awayScoreStr);
      if (isNaN(homeScore) || isNaN(awayScore)) return '';

      if (match.Team_Home.toLowerCase().includes(teamToCheck.toLowerCase())) {
        if (homeScore > awayScore) return 'V';
        if (homeScore < awayScore) return 'D';
        return 'E';
      } else if (match.Team_Away.toLowerCase().includes(teamToCheck.toLowerCase())) {
        if (awayScore > homeScore) return 'V';
        if (awayScore < homeScore) return 'D';
        return 'E';
      }
      return '';
    } catch {
      return '';
    }
  };

  if (isError || error) {
    return (
      <Card className="bg-white/95 backdrop-blur-sm border-red-200 shadow-lg z-10">
        <CardHeader className="pb-3">
          <CardTitle className="text-center text-lg text-red-600 flex items-center justify-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Erro ao Carregar Confrontos Diretos
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center space-y-2">
            <p className="text-red-600 text-sm">
              {error instanceof Error ? error.message : 'Não foi possível carregar os dados dos confrontos.'}
            </p>
            <p className="text-gray-500 text-xs">
              Verifique a conexão com a internet e tente novamente.
            </p>
          </div>
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
            Carregando Confrontos...
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
            <span className="text-blue-600 text-sm">Carregando confrontos diretos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg z-10">
        <CardHeader className="pb-3">
          <CardTitle className="text-center text-lg text-gray-800 flex items-center justify-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Confrontos Diretos
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-4">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-600 text-sm mb-2">
              Nenhum confronto direto encontrado entre as equipes.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg z-10">
      <CardHeader className="pb-3">
        <CardTitle className="text-center text-lg text-gray-800 flex items-center justify-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Últimos Confrontos Diretos
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {matches.map((match, index) => {
            const resultTeam1 = getMatchResult(match, team1);
            return (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-xs text-gray-600 font-medium">{formatDate(match.Date)}</span>
                    {match.League && match.League !== 'Unknown' && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">{match.League}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span title="Time da casa">
                      <Home className="h-4 w-4 text-green-600" />
                    </span>
                    <div
                      className={`px-2 py-1 rounded text-xs font-bold border ${
                        resultTeam1 === 'V'
                          ? 'text-green-600 bg-green-50 border-green-200'
                          : resultTeam1 === 'D'
                          ? 'text-red-600 bg-red-50 border-red-200'
                          : 'text-yellow-600 bg-yellow-50 border-yellow-200'
                      }`}
                    >
                      {resultTeam1}
                    </div>
                  </div>
                </div>

                <div className="text-sm font-semibold text-gray-800 mb-1">
                  {match.Team_Home} vs {match.Team_Away}
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-600">
                  {match.HT_Score && match.HT_Score !== '0-0' && (
                    <span>
                      <strong>HT:</strong> {formatScore(match.HT_Score)}
                    </span>
                  )}
                  <span>
                    <strong>FT:</strong> {formatScore(match.Score)}
                  </span>
                  {match.Status && match.Status !== 'FT' && (
                    <span className="text-yellow-600">{match.Status}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
