
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
  const { data: matches, isLoading, error, isError } = useHeadToHead(homeTeam, awayTeam);

  console.log('🏟️ HeadToHeadCard render:', { 
    homeTeam, 
    awayTeam, 
    matchesCount: matches?.length, 
    isLoading, 
    error: error?.message 
  });

  if (!homeTeam && !awayTeam) {
    return null;
  }

 const formatDate = (dateString: string): string => {
  // dateString esperado: "YYYY-MM-DD"
  if (!dateString) return '';

  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString; // fallback se formato inesperado

  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};


  const getMatchResult = (match: HeadToHeadMatch, teamToCheck?: string): string => {
    if (!teamToCheck || !match.Score || !match.Score.includes('-')) return '';
    
    try {
      const [homeScore, awayScore] = match.Score.split('-').map(s => parseInt(s.trim()));
      
      if (isNaN(homeScore) || isNaN(awayScore)) return '';
      
      if (match.Team_Home === teamToCheck) {
        if (homeScore > awayScore) return 'V';
        if (homeScore < awayScore) return 'D';
        return 'E';
      } else {
        if (awayScore > homeScore) return 'V';
        if (awayScore < homeScore) return 'D';
        return 'E';
      }
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

  const getCardTitle = (): string => {
    if (homeTeam && awayTeam) {
      return `Histórico: ${homeTeam} vs ${awayTeam}`;
    }
    return `Últimos Jogos: ${homeTeam || awayTeam}`;
  };

  if (isError || error) {
    console.error('❌ HeadToHeadCard error:', error);
    return (
      <Card className="bg-white/95 backdrop-blur-sm border-red-200 shadow-lg z-10">
        <CardHeader className="pb-3">
          <CardTitle className="text-center text-lg text-red-600 flex items-center justify-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Erro ao Carregar Confrontos
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

  if (!matches || matches.length === 0) {
    return (
      <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg z-10">
        <CardHeader className="pb-3">
          <CardTitle className="text-center text-lg text-gray-800 flex items-center justify-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            {getCardTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-4">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-600 text-sm mb-2">
              Nenhum confronto encontrado para as equipes selecionadas.
            </p>
            <p className="text-gray-500 text-xs">
              Os dados podem estar sendo carregados ou não estão disponíveis.
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
          {getCardTitle()}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {matches.map((match, index) => {
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
                    {match.League && match.League !== 'Unknown' && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {match.League}
                      </span>
                    )}
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
          })}
          
          <div className="text-center mt-4 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Mostrando {matches.length} confronto{matches.length !== 1 ? 's' : ''} encontrado{matches.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
