import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, TrendingUp } from 'lucide-react';
import { useScoreFrequency } from '@/hooks/useScoreFrequency';

interface ScoreFrequencyCardProps {
  type: 'HT' | 'FT';
  title: string;
  homeTeam: { name: string; league: string } | null;
  awayTeam: { name: string; league: string } | null;
  maxItems?: number;
}

export const ScoreFrequencyCard: React.FC<ScoreFrequencyCardProps> = ({ 
  type, 
  title,
  homeTeam,
  awayTeam,
  maxItems = 6
}) => {
  const { htFrequency, ftFrequency, isLoading, error, leagueMismatch } = 
    useScoreFrequency(homeTeam, awayTeam);

  const scores = type === 'HT' ? htFrequency : ftFrequency;

  // Debug - remover após verificação
  React.useEffect(() => {
    console.log(`Dados ${type}:`, {
      scores,
      inputTeams: { home: homeTeam?.league, away: awayTeam?.league },
      hasData: scores.length > 0
    });
  }, [scores, type]);

  if (isLoading) {
    return (
      <Card className="border rounded-lg shadow-sm min-h-[200px] flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {type === 'HT' ? (
              <Clock className="h-5 w-5 text-blue-500" />
            ) : (
              <TrendingUp className="h-5 w-5 text-green-500" />
            )}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
          <div className="text-center text-gray-500">Carregando dados...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border rounded-lg shadow-sm border-red-100 bg-red-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {type === 'HT' ? (
              <Clock className="h-5 w-5 text-blue-500" />
            ) : (
              <TrendingUp className="h-5 w-5 text-green-500" />
            )}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500 py-2">
            {error.includes('Não foi possível carregar') ? (
              <>
                <p>Erro ao carregar dados</p>
                <p className="text-sm mt-1">Verifique a conexão ou os arquivos de dados</p>
              </>
            ) : (
              error
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (leagueMismatch) {
    return (
      <Card className="border rounded-lg shadow-sm border-yellow-100 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {type === 'HT' ? (
              <Clock className="h-5 w-5 text-blue-500" />
            ) : (
              <TrendingUp className="h-5 w-5 text-green-500" />
            )}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-yellow-700 py-2">
            <p>Times de ligas diferentes</p>
            <p className="text-sm">Dados comparativos não disponíveis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border rounded-lg shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {type === 'HT' ? (
            <Clock className="h-5 w-5 text-blue-500" />
          ) : (
            <TrendingUp className="h-5 w-5 text-green-500" />
          )}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {scores.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {scores.slice(0, maxItems).map((item) => (
              <div 
                key={`${type}-${item.score}-${item.count}`}
                className="border p-2 rounded text-center hover:bg-gray-50 transition-colors"
              >
                <div className="font-bold text-gray-800">{item.score}</div>
                <div className="text-sm text-primary font-medium">
                  {item.percentage.includes('%') ? item.percentage : `${item.percentage}%`}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {item.count} {item.count === 1 ? 'jogo' : 'jogos'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500">Nenhum dado encontrado</p>
            <p className="text-sm text-gray-400 mt-1">
              {homeTeam?.league ? `para ${homeTeam.league}` : ''}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
