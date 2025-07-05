
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamStats } from '@/types/goalStats';
import { getDixonColesScores, getDixonColesStats } from '@/utils/dixonColes';
import { TrendingUp, Target, BarChart3 } from 'lucide-react';

interface DixonColesScoresProps {
  homeStats?: TeamStats;
  awayStats?: TeamStats;
}

export const DixonColesScores: React.FC<DixonColesScoresProps> = ({
  homeStats,
  awayStats,
}) => {
  if (!homeStats || !awayStats) {
    return null;
  }

  const dixonColesScores = getDixonColesScores(homeStats.Avg, awayStats.Avg, 8, 8);
  const stats = getDixonColesStats(homeStats.Avg, awayStats.Avg);

  if (dixonColesScores.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Placares Mais Prováveis */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-gray-800 flex items-center justify-center gap-2">
            <Target className="h-6 w-6" />
            Placares Mais Prováveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {dixonColesScores.map((item, index) => (
              <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 shadow-sm">
                <div className="font-bold text-2xl text-gray-800 mb-1">{item.score}</div>
                <div className="text-lg font-semibold text-blue-600">
                  {Math.round(item.probability * 100)}%
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-500 mt-4">
            #Calculado usando o modelo com correções para placares baixos e vantagem de casa.
          </p>
        </CardContent>
      </Card>

      {/* Estatísticas do Jogo */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-gray-800 flex items-center justify-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Probabilidades do Jogo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Resultado Final */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-3 text-center">Resultado Final</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Vitória Casa</span>
                  <span className="font-bold text-green-600">{stats.homeWin}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Empate</span>
                  <span className="font-bold text-yellow-600">{stats.draw}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Vitória Visitante</span>
                  <span className="font-bold text-red-600">{stats.awayWin}%</span>
                </div>
              </div>
            </div>

            {/* Total de Gols */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-3 text-center">Total de Gols</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Mais de 1.5</span>
                  <span className="font-bold text-blue-600">{stats.over15}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Mais de 2.5</span>
                  <span className="font-bold text-blue-600">{stats.over25}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Mais de 3.5</span>
                  <span className="font-bold text-blue-600">{stats.over35}%</span>
                </div>
              </div>
            </div>

            {/* Ambos Marcam */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-3 text-center">Ambos Marcam</h4>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">{stats.bts}%</div>
                <p className="text-sm text-gray-600">Probabilidade de ambos os times marcarem</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
