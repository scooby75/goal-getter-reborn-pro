import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, Clock, Calendar, Home, Plane } from 'lucide-react';
import { useRecentGames, RecentGameMatch } from '@/hooks/useRecentGames';

interface RecentGamesCardProps {
  homeTeam: string;
  awayTeam: string;
}

export const RecentGamesCard: React.FC<RecentGamesCardProps> = ({
  homeTeam,
  awayTeam,
}) => {
  const { data: matches, isLoading, error, isError } = useRecentGames(homeTeam, awayTeam);

  if (!homeTeam && !awayTeam) return null;

  const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // mês começa em 0
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
};


  const getMatchResult = (match: RecentGameMatch, teamToCheck: string): string => {
    if (!match.Score || !match.Score.includes('-')) return '';
    try {
      const [homeScore, awayScore] = match.Score.split('-').map(s => parseInt(s.trim()));
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
    } catch (e) {
      console.warn('Erro ao analisar resultado:', e);
      return '';
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

  if (isError || error) {
    return (
      <Card className="bg-white/95 backdrop-blur-sm border-red-200 shadow-lg z-10">
        <CardHeader className="pb-3">
          <CardTitle className="text-center text-lg text-red-600 flex items-center justify-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Erro ao Carregar Jogos Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center space-y-2">
            <p className="text-red-600 text-sm">
              {error instanceof Error ? error.message : 'Não foi possível carregar os dados dos jogos recentes.'}
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
            Jogos Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
            <span className="text-blue-600 text-sm">Carregando jogos recentes...</span>
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
            Jogos Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-4">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-600 text-sm mb-2">
              Nenhum jogo recente encontrado para as equipes selecionadas.
            </p>
            <p className="text-gray-500 text-xs">
              Os dados podem estar sendo carregados ou não estão disponíveis.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filtrar partidas para home e away separadamente
  const homeMatches = matches.filter(match =>
    homeTeam && match.Team_Home.toLowerCase().includes(homeTeam.toLowerCase())
  );

  const awayMatches = matches.filter(match =>
    awayTeam && match.Team_Away.toLowerCase().includes(awayTeam.toLowerCase())
  );

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg z-10">
      <CardHeader className="pb-3">
        <CardTitle className="text-center text-lg text-gray-800 flex items-center justify-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Jogos Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Coluna Home */}
          <div>
            <h3 className="text-center font-semibold mb-3">{homeTeam}</h3>
            {homeMatches.length > 0 ? (
              homeMatches.map((match, index) => {
                const result = getMatchResult(match, homeTeam);
                return (
                  <div
                    key={`home-${index}`}
                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors mb-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-xs text-gray-600 font-medium">
                          {formatDate(match.Date)}
                        </span>
                        {match.League && match.League !== 'Unknown' && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {match.League}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span title="Jogando em casa">
                          <Home className="h-4 w-4 text-green-600" />
                        </span>
                        {result && (
                          <div className={`px-2 py-1 rounded text-xs font-bold border ${getResultColor(result)}`}>
                            {result}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-800 mb-1">
                          {match.Team_Home} vs {match.Team_Away}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          {match.HT_Score && match.HT_Score !== '0-0' && (
                            <span>
                              <strong>HT:</strong> {match.HT_Score}
                            </span>
                          )}
                          <span>
                            <strong>FT:</strong> {match.Score}
                          </span>
                          {match.Status && match.Status !== 'FT' && (
                            <span className="text-yellow-600">
                              {match.Status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-gray-500 text-sm">Nenhum jogo recente em casa.</p>
            )}
          </div>

          {/* Coluna Away */}
          <div>
            <h3 className="text-center font-semibold mb-3">{awayTeam}</h3>
            {awayMatches.length > 0 ? (
              awayMatches.map((match, index) => {
                const result = getMatchResult(match, awayTeam);
                return (
                  <div
                    key={`away-${index}`}
                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors mb-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-xs text-gray-600 font-medium">
                          {formatDate(match.Date)}
                        </span>
                        {match.League && match.League !== 'Unknown' && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {match.League}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span title="Jogando fora">
                          <Plane className="h-4 w-4 text-blue-600" />
                        </span>
                        {result && (
                          <div className={`px-2 py-1 rounded text-xs font-bold border ${getResultColor(result)}`}>
                            {result}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-800 mb-1">
                          {match.Team_Home} vs {match.Team_Away}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          {match.HT_Score && match.HT_Score !== '0-0' && (
                            <span>
                              <strong>HT:</strong> {match.HT_Score}
                            </span>
                          )}
                          <span>
                            <strong>FT:</strong> {match.Score}
                          </span>
                          {match.Status && match.Status !== 'FT' && (
                            <span className="text-yellow-600">
                              {match.Status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-gray-500 text-sm">Nenhum jogo recente fora.</p>
            )}
          </div>
        </div>

        <div className="text-center mt-4 pt-3 border-t border-gray-200 col-span-2">
          <p className="text-xs text-gray-500">
            Mostrando {matches.length} jogo{matches.length !== 1 ? 's' : ''} recente{matches.length !== 1 ? 's' : ''}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
