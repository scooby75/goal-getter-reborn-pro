
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamStats } from '@/types/goalStats';
import { useMarkovPoisson } from '@/hooks/useMarkovPoisson';
import { useAdvancedScorePrediction } from '@/hooks/useAdvancedScorePrediction';
import { Activity, Target, TrendingUp, BarChart3 } from 'lucide-react';

interface AdvancedPredictionTabProps {
  homeStats?: TeamStats;
  awayStats?: TeamStats;
}

export const AdvancedPredictionTab: React.FC<AdvancedPredictionTabProps> = ({
  homeStats,
  awayStats,
}) => {
  const { data: poissonData, isLoading: poissonLoading } = useMarkovPoisson(homeStats, awayStats);
  const { data: advancedScores, isLoading: scoresLoading } = useAdvancedScorePrediction(homeStats, awayStats);

  const isLoading = poissonLoading || scoresLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Calculando previsões avançadas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modelo Poisson com Markov */}
      <Card className="border rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Modelo Poisson com Cadeias de Markov
          </CardTitle>
          <p className="text-sm text-gray-600">
            Modelo com inteligência artificial e correções para placares baixos + vantagem de casa
          </p>
        </CardHeader>
        <CardContent>
          {!poissonData ? (
            <div className="text-center text-gray-500 py-4">
              Dados insuficientes para análise
            </div>
          ) : (
            <div className="space-y-6">
              {/* Probabilidades do Resultado */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-4">Resultado Final</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-600">
                      {poissonData.homeWin.toFixed(0)}%
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Vitória Casa</div>
                  </div>
                  
                  <div className="text-center bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="text-2xl font-bold text-yellow-600">
                      {poissonData.draw.toFixed(0)}%
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Empate</div>
                  </div>
                  
                  <div className="text-center bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">
                      {poissonData.awayWin.toFixed(0)}%
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Vitória Visitante</div>
                  </div>
                </div>
              </div>

              {/* Placares Mais Prováveis - Poisson-Markov */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-4">Placares Mais Prováveis (Poisson-Markov)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {poissonData.mostProbableScores.slice(0, 8).map((prediction, index) => (
                    <div
                      key={prediction.score}
                      className={`
                        border-2 p-3 rounded-lg text-center hover:shadow-md transition-all
                        ${index === 0 ? 'border-blue-500 bg-blue-50' : 
                          index === 1 ? 'border-green-500 bg-green-50' : 
                          index === 2 ? 'border-purple-500 bg-purple-50' : 
                          'border-gray-300 bg-gray-50'}
                      `}
                    >
                      <div className="font-bold text-lg text-gray-800 mb-1">
                        {prediction.score}
                      </div>
                      <div className={`
                        text-sm font-semibold
                        ${index === 0 ? 'text-blue-600' : 
                          index === 1 ? 'text-green-600' : 
                          index === 2 ? 'text-purple-600' : 
                          'text-gray-600'}
                      `}>
                        {prediction.probability.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Informações do Modelo */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-700">Detalhes do Modelo</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Confiança:</span>
                    <span className="ml-2 font-medium">{poissonData.confidence.toFixed(0)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Influência Markov:</span>
                    <span className="ml-2 font-medium">{poissonData.markovInfluence.toFixed(0)}%</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Combina distribuição de Poisson com padrões sequenciais das Cadeias de Markov
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Placares Mais Prováveis - Modelo Avançado */}
      <Card className="border rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-500" />
            Placares Mais Prováveis (Modelo Avançado)
          </CardTitle>
          <p className="text-sm text-gray-600">
            Calculado com modelo avançado com correções para placares baixos e vantagem de casa
          </p>
        </CardHeader>
        <CardContent>
          {!advancedScores || advancedScores.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              Dados insuficientes para previsão
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {advancedScores.map((prediction, index) => (
                  <div
                    key={prediction.score}
                    className={`
                      border-2 p-3 rounded-lg text-center hover:shadow-md transition-all cursor-default
                      ${index === 0 ? 'border-purple-500 bg-purple-50' : 
                        index === 1 ? 'border-blue-500 bg-blue-50' : 
                        index === 2 ? 'border-green-500 bg-green-50' : 
                        'border-gray-300 bg-gray-50'}
                    `}
                  >
                    <div className="font-bold text-xl text-gray-800 mb-1">
                      {prediction.score}
                    </div>
                    <div className={`
                      text-sm font-semibold mb-1
                      ${index === 0 ? 'text-purple-600' : 
                        index === 1 ? 'text-blue-600' : 
                        index === 2 ? 'text-green-600' : 
                        'text-gray-600'}
                    `}>
                      {prediction.finalProbability.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {index === 0 && <TrendingUp className="h-3 w-3 inline mr-1" />}
                      #{index + 1}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
                <p className="text-xs text-gray-600">
                  • Pesos: H2H (40%), Casa (25%), Visitante (25%), Liga (10%)
                </p>
                <p className="text-xs text-gray-600">
                  • Baseado nos dados históricos mais recentes disponíveis
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
