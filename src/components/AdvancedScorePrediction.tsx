
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp } from 'lucide-react';
import { useAdvancedScorePrediction } from '@/hooks/useAdvancedScorePrediction';
import { TeamStats } from '@/types/goalStats';

interface AdvancedScorePredictionProps {
  homeStats?: TeamStats;
  awayStats?: TeamStats;
}

export const AdvancedScorePrediction: React.FC<AdvancedScorePredictionProps> = ({
  homeStats,
  awayStats,
}) => {
  const { data: predictions, isLoading, error } = useAdvancedScorePrediction(homeStats, awayStats);

  if (isLoading) {
    return (
      <Card className="border rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-500" />
            Placares Mais Prováveis (Modelo Avançado)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-4">
            Calculando previsões avançadas...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border rounded-lg shadow-sm border-red-100 bg-red-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-500" />
            Placares Mais Prováveis (Modelo Avançado)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-600 py-2">
            <p>Erro ao calcular previsões</p>
            <p className="text-sm">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!predictions || predictions.length === 0) {
    return (
      <Card className="border rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-500" />
            Placares Mais Prováveis (Modelo Avançado)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-4">
            Dados insuficientes para previsão
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border rounded-lg shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-purple-500" />
          Placares Mais Prováveis (Modelo Avançado)
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Baseado em H2H, jogos dos times e dados da liga
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {predictions.map((prediction, index) => (
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
        <div className="mt-4 text-xs text-gray-500">
          <p>• Pesos: H2H (40%), Casa (25%), Visitante (25%), Liga (10%)</p>
          <p>• Baseado nos dados históricos mais recentes disponíveis</p>
        </div>
      </CardContent>
    </Card>
  );
};
