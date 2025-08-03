
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamStats } from '@/types/goalStats';
import { useMarkovChain } from '@/hooks/useMarkovChain';
import { TrendingUp, Activity, AlertCircle, BarChart3 } from 'lucide-react';

interface MarkovChainPredictionProps {
  homeStats?: TeamStats;
  awayStats?: TeamStats;
}

const StateLabel = {
  'V': 'Vitória',
  'E': 'Empate', 
  'D': 'Derrota'
} as const;

const getStateColor = (state: 'V' | 'E' | 'D') => {
  switch (state) {
    case 'V': return 'text-green-600 bg-green-50';
    case 'E': return 'text-yellow-600 bg-yellow-50';
    case 'D': return 'text-red-600 bg-red-50';
  }
};

export const MarkovChainPrediction: React.FC<MarkovChainPredictionProps> = ({
  homeStats,
  awayStats,
}) => {
  const { 
    data: prediction, 
    isLoading, 
    isError, 
    error 
  } = useMarkovChain(homeStats?.Team, awayStats?.Team);

  if (!homeStats || !awayStats) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-gray-800 flex items-center justify-center gap-2">
            <Activity className="h-6 w-6" />
            Análise Cadeias de Markov
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Calculando probabilidades...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !prediction) {
    return (
      <Card className="shadow-lg border-red-200">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-gray-800 flex items-center justify-center gap-2">
            <AlertCircle className="h-6 w-6 text-red-500" />
            Análise Cadeias de Markov
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-600 mb-2">Erro na análise probabilística</div>
            <div className="text-gray-500 text-sm">{error?.message}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-center text-2xl text-gray-800 flex items-center justify-center gap-2">
          <BarChart3 className="h-6 w-6 text-purple-600" />
          Análise Cadeias de Markov
        </CardTitle>
        <div className="text-center text-sm text-gray-600">
          Baseado nos últimos 6 jogos (casa vs fora)
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Probabilidades do Resultado */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
            Probabilidades do Resultado
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {prediction.homeWin.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Vitória {homeStats.Team}
              </div>
            </div>
            
            <div className="text-center bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">
                {prediction.draw.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Empate</div>
            </div>
            
            <div className="text-center bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">
                {prediction.awayWin.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Vitória {awayStats.Team}
              </div>
            </div>
          </div>
        </div>

        {/* Estados Atuais */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-2">
              {homeStats.Team} (Casa)
            </h4>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Último resultado:</span>
              {prediction.homeLastState ? (
                <span className={`px-2 py-1 rounded text-sm font-medium ${getStateColor(prediction.homeLastState)}`}>
                  {StateLabel[prediction.homeLastState]}
                </span>
              ) : (
                <span className="text-gray-400 text-sm">N/A</span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {prediction.homeGamesAnalyzed} jogos analisados
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-2">
              {awayStats.Team} (Fora)
            </h4>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Último resultado:</span>
              {prediction.awayLastState ? (
                <span className={`px-2 py-1 rounded text-sm font-medium ${getStateColor(prediction.awayLastState)}`}>
                  {StateLabel[prediction.awayLastState]}
                </span>
              ) : (
                <span className="text-gray-400 text-sm">N/A</span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {prediction.awayGamesAnalyzed} jogos analisados
            </div>
          </div>
        </div>

        {/* Matrizes de Transição */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-700 mb-3 text-center">
              Matriz {homeStats.Team}
            </h4>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left">De/Para</th>
                    <th className="p-2 text-center">V</th>
                    <th className="p-2 text-center">E</th>
                    <th className="p-2 text-center">D</th>
                  </tr>
                </thead>
                <tbody>
                  {(['V', 'E', 'D'] as const).map(from => (
                    <tr key={from} className="border-t">
                      <td className={`p-2 font-medium ${getStateColor(from)}`}>
                        {from}
                      </td>
                      <td className="p-2 text-center">
                        {(prediction.homeTransitionMatrix[from].V * 100).toFixed(0)}%
                      </td>
                      <td className="p-2 text-center">
                        {(prediction.homeTransitionMatrix[from].E * 100).toFixed(0)}%
                      </td>
                      <td className="p-2 text-center">
                        {(prediction.homeTransitionMatrix[from].D * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-700 mb-3 text-center">
              Matriz {awayStats.Team}
            </h4>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left">De/Para</th>
                    <th className="p-2 text-center">V</th>
                    <th className="p-2 text-center">E</th>
                    <th className="p-2 text-center">D</th>
                  </tr>
                </thead>
                <tbody>
                  {(['V', 'E', 'D'] as const).map(from => (
                    <tr key={from} className="border-t">
                      <td className={`p-2 font-medium ${getStateColor(from)}`}>
                        {from}
                      </td>
                      <td className="p-2 text-center">
                        {(prediction.awayTransitionMatrix[from].V * 100).toFixed(0)}%
                      </td>
                      <td className="p-2 text-center">
                        {(prediction.awayTransitionMatrix[from].E * 100).toFixed(0)}%
                      </td>
                      <td className="p-2 text-center">
                        {(prediction.awayTransitionMatrix[from].D * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Rodapé com informações */}
        <div className="text-center bg-purple-50 border border-purple-200 p-3 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Activity className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">
              Confiança da Análise: {prediction.confidence.toFixed(0)}%
            </span>
          </div>
          <p className="text-xs text-gray-600">
            Modelo baseado em Cadeias de Markov usando os últimos 6 jogos de cada time em sua condição específica (casa/fora)
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
