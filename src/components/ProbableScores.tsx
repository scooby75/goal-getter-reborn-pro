
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamStats } from '@/types/goalStats';
import { getProbableScores } from '@/utils/poisson';
import { TrendingUp } from 'lucide-react';

interface ProbableScoresProps {
  homeStats?: TeamStats;
  awayStats?: TeamStats;
}

export const ProbableScores: React.FC<ProbableScoresProps> = ({
  homeStats,
  awayStats,
}) => {
  if (!homeStats || !awayStats) {
    return null;
  }

  const probableScores = getProbableScores(homeStats.Avg, awayStats.Avg, 10, 8);

  if (probableScores.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-center text-2xl text-gray-800 flex items-center justify-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Placares Mais Prováveis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {probableScores.map((item, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="font-bold text-2xl text-gray-800 mb-1">{item.score}</div>
              <div className="text-lg font-semibold text-blue-600">
                {Math.round(item.probability * 100)}%
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-500 mt-4">
          #Calculado usando a distribuição de Poisson com base nas médias de gols das equipes.
        </p>
      </CardContent>
    </Card>
  );
};
