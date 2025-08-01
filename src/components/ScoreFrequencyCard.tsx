import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Clock } from 'lucide-react';
import { useScoreFrequency } from '@/hooks/useScoreFrequency';

interface ScoreFrequencyCardProps {
  type: 'HT' | 'FT';
  title: string;
  maxItems: number;
  homeTeam: { name: string; league: string } | null;
  awayTeam: { name: string; league: string } | null;
}

export const ScoreFrequencyCard: React.FC<ScoreFrequencyCardProps> = ({ 
  type, 
  title, 
  maxItems,
  homeTeam,
  awayTeam
}) => {
  const { htFrequency, ftFrequency, isLoading, error, leagueMismatch } = useScoreFrequency(homeTeam, awayTeam);
  
  const scores = type === 'HT' ? htFrequency.slice(0, maxItems) : ftFrequency.slice(0, maxItems);

  if (isLoading) {
    return (
      <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-lg text-gray-800 flex items-center justify-center gap-2">
            {type === 'HT' ? <Clock className="h-5 w-5 text-blue-600" /> : <TrendingUp className="h-5 w-5 text-green-600" />}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">Carregando dados...</div>
        </CardContent>
      </Card>
    );
  }

  if (leagueMismatch) {
    return (
      <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-lg text-gray-800 flex items-center justify-center gap-2">
            {type === 'HT' ? <Clock className="h-5 w-5 text-blue-600" /> : <TrendingUp className="h-5 w-5 text-green-600" />}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-yellow-600">
            Times de ligas diferentes - dados não disponíveis
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-lg text-gray-800 flex items-center justify-center gap-2">
            {type === 'HT' ? <Clock className="h-5 w-5 text-blue-600" /> : <TrendingUp className="h-5 w-5 text-green-600" />}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg">
      <CardHeader>
        <CardTitle className="text-center text-lg text-gray-800 flex items-center justify-center gap-2">
          {type === 'HT' ? <Clock className="h-5 w-5 text-blue-600" /> : <TrendingUp className="h-5 w-5 text-green-600" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {scores.map((item, index) => (
            <div key={`${item.score}-${index}`} className="text-center">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="text-lg font-bold text-gray-800 mb-1">
                  {item.score}
                </div>
                <div className="text-sm text-gray-600">
                  {item.percentage.includes('%') ? item.percentage : `${item.percentage}%`}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {item.count} jogos
                </div>
              </div>
            </div>
          ))}
        </div>
        {scores.length === 0 && (
          <div className="text-center text-gray-500">
            Nenhum dado de placar encontrado para esta liga
          </div>
        )}
      </CardContent>
    </Card>
  );
};
