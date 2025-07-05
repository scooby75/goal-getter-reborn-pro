
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamStats } from '@/types/goalStats';
import { getDixonColesScores, getDixonColesStats } from '@/utils/dixonColes';
import { TrendingUp, Target, BarChart3, Shield } from 'lucide-react';

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
    <div className="space-y-4">
      {/* Placares Mais Prováveis */}
      <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-center text-xl text-gray-800 flex items-center justify-center gap-2">
            <Target className="h-6 w-6 text-blue-600" />
            Placares Mais Prováveis
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {dixonColesScores.map((item, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 p-4 rounded-lg shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md">
                <div className="font-bold text-xl text-gray-900 mb-1">{item.score}</div>
                <div className="text-lg font-semibold text-blue-600">
                  {Math.round(item.probability * 100)}%
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <p className="text-xs text-gray-700 flex items-center justify-center gap-2">
              <Shield className="h-3 w-3 text-blue-600" />
              Calculado com modelo avançado com correções para placares baixos e vantagem de casa
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas do Jogo */}
      <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-center text-xl text-gray-800 flex items-center justify-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Análise Probabilística
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Resultado Final */}
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg shadow-sm">
              <h4 className="font-bold text-gray-800 mb-3 text-center text-base flex items-center justify-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Resultado Final
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-white border border-gray-100 rounded-md">
                  <span className="text-gray-700 font-medium text-sm">Vitória Casa</span>
                  <span className="font-bold text-green-600 text-sm">{stats.homeWin}%</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white border border-gray-100 rounded-md">
                  <span className="text-gray-700 font-medium text-sm">Empate</span>
                  <span className="font-bold text-yellow-600 text-sm">{stats.draw}%</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white border border-gray-100 rounded-md">
                  <span className="text-gray-700 font-medium text-sm">Vitória Visitante</span>
                  <span className="font-bold text-red-600 text-sm">{stats.awayWin}%</span>
                </div>
              </div>
            </div>

            {/* Total de Gols */}
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg shadow-sm">
              <h4 className="font-bold text-gray-800 mb-3 text-center text-base flex items-center justify-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                Total de Gols
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-white border border-gray-100 rounded-md">
                  <span className="text-gray-700 font-medium text-sm">Mais de 1.5</span>
                  <span className="font-bold text-blue-600 text-sm">{stats.over15}%</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white border border-gray-100 rounded-md">
                  <span className="text-gray-700 font-medium text-sm">Mais de 2.5</span>
                  <span className="font-bold text-blue-600 text-sm">{stats.over25}%</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white border border-gray-100 rounded-md">
                  <span className="text-gray-700 font-medium text-sm">Mais de 3.5</span>
                  <span className="font-bold text-blue-600 text-sm">{stats.over35}%</span>
                </div>
              </div>
            </div>

            {/* Ambos Marcam */}
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg shadow-sm">
              <h4 className="font-bold text-gray-800 mb-3 text-center text-base flex items-center justify-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                Ambos Marcam
              </h4>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{stats.bts}%</div>
                <p className="text-gray-700 font-medium text-xs">Probabilidade de ambos os times marcarem</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
