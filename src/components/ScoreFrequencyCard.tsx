import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, TrendingUp } from 'lucide-react';
import { useScoreFrequency } from '@/hooks/useScoreFrequency';

interface ScoreFrequencyCardProps {
  type: 'HT' | 'FT';
  title: string;
  homeTeam: { name: string; league: string } | null;
  awayTeam: { name: string; league: string } | null;
}

export const ScoreFrequencyCard: React.FC<ScoreFrequencyCardProps> = ({ 
  type, 
  title,
  homeTeam,
  awayTeam
}) => {
  const { htFrequency, ftFrequency, isLoading, error, leagueMismatch } = 
    useScoreFrequency(homeTeam, awayTeam);

  const scores = type === 'HT' ? htFrequency : ftFrequency;

  if (isLoading) {
    return <div className="p-4 text-center">Carregando...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  if (leagueMismatch) {
    return (
      <div className="p-4 text-center text-yellow-600">
        Times de ligas diferentes - dados não disponíveis
      </div>
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
          <div className="grid grid-cols-3 gap-2">
            {scores.slice(0, 6).map((item, index) => (
              <div key={index} className="border p-2 rounded text-center">
                <div className="font-bold">{item.score}</div>
                <div className="text-sm">{item.percentage}</div>
                <div className="text-xs text-gray-500">{item.count} jogos</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4">
            Nenhum dado encontrado para esta liga
          </div>
        )}
      </CardContent>
    </Card>
  );
};
