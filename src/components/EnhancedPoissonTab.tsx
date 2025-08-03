
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamStats } from '@/types/goalStats';
import { useEnhancedPoisson } from '@/hooks/useEnhancedPoisson';
import { BarChart3, Target, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';

interface EnhancedPoissonTabProps {
  homeStats?: TeamStats;
  awayStats?: TeamStats;
}

export const EnhancedPoissonTab: React.FC<EnhancedPoissonTabProps> = ({
  homeStats,
  awayStats,
}) => {
  const { 
    data: scores, 
    isLoading, 
    isError, 
    error 
  } = useEnhancedPoisson(homeStats?.Team, awayStats?.Team);

  if (!homeStats || !awayStats) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">Selecione ambos os times para ver as previsões</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
        <span className="text-gray-600 text-lg">Calculando placares mais prováveis...</span>
      </div>
    );
  }

  if (isError || !scores) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
            <p className="text-red-600 mb-2">Erro ao calcular previsões</p>
            <p className="text-gray-500 text-sm">{error?.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-gray-800 flex items-center justify-center gap-2">
            <Target className="h-6 w-6 text-blue-600" />
            Placares Mais Prováveis 
          </CardTitle>
          <div className="text-center text-sm text-gray-600">
            
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {scores.map((scoreData, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-800">
                        {scoreData.score}
                      </div>
                      <div className="text-xs text-gray-500">
                        {homeStats.Team} vs {awayStats.Team}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-600">
                      {(scoreData.probability * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      Probabilidade
                    </div>
                  </div>
                </div>
                
                {/* Barra de progresso visual */}
                <div className="mt-3">
                  <div className="bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${scoreData.probability * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Resumo estatístico */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center bg-green-50 p-3 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {scores.filter(s => s.homeGoals > s.awayGoals).reduce((sum, s) => sum + s.probability, 0) * 100 | 0}%
              </div>
              <div className="text-sm text-gray-600">Vitória Casa</div>
            </div>
            <div className="text-center bg-yellow-50 p-3 rounded-lg">
              <div className="text-lg font-bold text-yellow-600">
                {scores.filter(s => s.homeGoals === s.awayGoals).reduce((sum, s) => sum + s.probability, 0) * 100 | 0}%
              </div>
              <div className="text-sm text-gray-600">Empate</div>
            </div>
            <div className="text-center bg-blue-50 p-3 rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                {scores.filter(s => s.homeGoals < s.awayGoals).reduce((sum, s) => sum + s.probability, 0) * 100 | 0}%
              </div>
              <div className="text-sm text-gray-600">Vitória Fora</div>
            </div>
          </div>

          {/* Informações do modelo */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Metodologia</span>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
