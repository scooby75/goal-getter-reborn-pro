
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
    <div className="space-y-6">
      {/* Placares Mais Prováveis */}
      <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-xl">
        <CardHeader>
          <CardTitle className="text-center text-3xl text-gray-800 flex items-center justify-center gap-3">
            <Target className="h-8 w-8 text-blue-600" />
            Placares Mais Prováveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {dixonColesScores.map((item, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 p-6 rounded-xl shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <div className="font-bold text-3xl text-gray-900 mb-2">{item.score}</div>
                <div className="text-xl font-semibold text-blue-600">
                  {Math.round(item.probability * 100)}%
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-xs text-gray-700 flex items-center justify-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              Calculado com modelo avançado Dixon-Coles com correções para placares baixos e vantagem de casa
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas do Jogo */}
      <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-xl">
        <CardHeader>
          <CardTitle className="text-center text-3xl text-gray-800 flex items-center justify-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            Análise Probabilística
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Resultado Final */}
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl shadow-md">
              <h4 className="font-bold text-gray-800 mb-4 text-center text-lg flex items-center justify-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Resultado Final
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-lg">
                  <span className="text-gray-700 font-medium">Vitória Casa</span>
                  <span className="font-bold text-green-600 text-lg">{stats.homeWin}%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-lg">
                  <span className="text-gray-700 font-medium">Empate</span>
                  <span className="font-bold text-yellow-600 text-lg">{stats.draw}%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-lg">
                  <span className="text-gray-700 font-medium">Vitória Visitante</span>
                  <span className="font-bold text-red-600 text-lg">{stats.awayWin}%</span>
                </div>
              </div>
            </div>

            {/* Total de Gols */}
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl shadow-md">
              <h4 className="font-bold text-gray-800 mb-4 text-center text-lg flex items-center justify-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Total de Gols
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-lg">
                  <span className="text-gray-700 font-medium">Mais de 1.5</span>
                  <span className="font-bold text-blue-600 text-lg">{stats.over15}%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-lg">
                  <span className="text-gray-700 font-medium">Mais de 2.5</span>
                  <span className="font-bold text-blue-600 text-lg">{stats.over25}%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-lg">
                  <span className="text-gray-700 font-medium">Mais de 3.5</span>
                  <span className="font-bold text-blue-600 text-lg">{stats.over35}%</span>
                </div>
              </div>
            </div>

            {/* Ambos Marcam */}
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl shadow-md">
              <h4 className="font-bold text-gray-800 mb-4 text-center text-lg flex items-center justify-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Ambos Marcam
              </h4>
              <div className="text-center">
                <div className="text-5xl font-bold text-blue-600 mb-3">{stats.bts}%</div>
                <p className="text-gray-700 font-medium">Probabilidade de ambos os times marcarem</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
