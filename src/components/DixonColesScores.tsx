
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
      <Card className="glass-effect border-crypto-steel/30 crypto-shadow">
        <CardHeader>
          <CardTitle className="text-center text-3xl text-white flex items-center justify-center gap-3">
            <Target className="h-8 w-8 text-crypto-steel" />
            Placares Mais Prováveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {dixonColesScores.map((item, index) => (
              <div key={index} className="glass-effect p-6 rounded-xl crypto-shadow transition-all duration-300 hover:scale-105">
                <div className="font-bold text-3xl text-white mb-2">{item.score}</div>
                <div className="text-xl font-semibold text-crypto-steel">
                  {Math.round(item.probability * 100)}%
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center glass-effect p-4 rounded-lg">
            <p className="text-xs text-crypto-light flex items-center justify-center gap-2">
              <Shield className="h-4 w-4" />
              Calculado com modelo avançado Dixon-Coles com correções para placares baixos e vantagem de casa
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas do Jogo */}
      <Card className="glass-effect border-crypto-steel/30 crypto-shadow">
        <CardHeader>
          <CardTitle className="text-center text-3xl text-white flex items-center justify-center gap-3">
            <BarChart3 className="h-8 w-8 text-crypto-steel" />
            Análise Probabilística
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Resultado Final */}
            <div className="glass-effect p-6 rounded-xl crypto-shadow">
              <h4 className="font-bold text-white mb-4 text-center text-lg flex items-center justify-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Resultado Final
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 glass-effect rounded-lg">
                  <span className="text-crypto-light font-medium">Vitória Casa</span>
                  <span className="font-bold text-green-400 text-lg">{stats.homeWin}%</span>
                </div>
                <div className="flex justify-between items-center p-3 glass-effect rounded-lg">
                  <span className="text-crypto-light font-medium">Empate</span>
                  <span className="font-bold text-yellow-400 text-lg">{stats.draw}%</span>
                </div>
                <div className="flex justify-between items-center p-3 glass-effect rounded-lg">
                  <span className="text-crypto-light font-medium">Vitória Visitante</span>
                  <span className="font-bold text-red-400 text-lg">{stats.awayWin}%</span>
                </div>
              </div>
            </div>

            {/* Total de Gols */}
            <div className="glass-effect p-6 rounded-xl crypto-shadow">
              <h4 className="font-bold text-white mb-4 text-center text-lg flex items-center justify-center gap-2">
                <Target className="h-5 w-5" />
                Total de Gols
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 glass-effect rounded-lg">
                  <span className="text-crypto-light font-medium">Mais de 1.5</span>
                  <span className="font-bold text-crypto-steel text-lg">{stats.over15}%</span>
                </div>
                <div className="flex justify-between items-center p-3 glass-effect rounded-lg">
                  <span className="text-crypto-light font-medium">Mais de 2.5</span>
                  <span className="font-bold text-crypto-steel text-lg">{stats.over25}%</span>
                </div>
                <div className="flex justify-between items-center p-3 glass-effect rounded-lg">
                  <span className="text-crypto-light font-medium">Mais de 3.5</span>
                  <span className="font-bold text-crypto-steel text-lg">{stats.over35}%</span>
                </div>
              </div>
            </div>

            {/* Ambos Marcam */}
            <div className="glass-effect p-6 rounded-xl crypto-shadow">
              <h4 className="font-bold text-white mb-4 text-center text-lg flex items-center justify-center gap-2">
                <Shield className="h-5 w-5" />
                Ambos Marcam
              </h4>
              <div className="text-center">
                <div className="text-5xl font-bold text-crypto-steel mb-3">{stats.bts}%</div>
                <p className="text-crypto-light font-medium">Probabilidade de ambos os times marcarem</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
