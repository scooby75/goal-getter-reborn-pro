
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamStats } from '@/types/goalStats';
import { useHistoricalScores } from '@/hooks/useHistoricalScores';
import { TrendingUp, Database, AlertCircle } from 'lucide-react';

interface ProbableScoresProps {
  homeStats?: TeamStats;
  awayStats?: TeamStats;
}

export const ProbableScores: React.FC<ProbableScoresProps> = ({
  homeStats,
  awayStats,
}) => {
  const { 
    scoreProbabilities, 
    isLoading, 
    isError, 
    error 
  } = useHistoricalScores(
    homeStats?.Team,
    awayStats?.Team,
    homeStats?.League_Name
  );

  if (!homeStats || !awayStats) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-gray-800 flex items-center justify-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Placares Mais Prováveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Carregando dados históricos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="shadow-lg border-red-200">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-gray-800 flex items-center justify-center gap-2">
            <AlertCircle className="h-6 w-6 text-red-500" />
            Placares Mais Prováveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-600 mb-2">Erro ao carregar dados históricos</div>
            <div className="text-gray-500 text-sm">{error?.message}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (scoreProbabilities.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-gray-800 flex items-center justify-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Placares Mais Prováveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-600 mb-2">Dados históricos insuficientes</div>
            <div className="text-gray-500 text-sm">
              Não foram encontrados jogos históricos suficientes para {homeStats.Team} vs {awayStats.Team} na {homeStats.League_Name}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-center text-2xl text-gray-800 flex items-center justify-center gap-2">
          <Database className="h-6 w-6 text-blue-600" />
          Placares Mais Prováveis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {scoreProbabilities.map((item, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md">
              <div className="font-bold text-2xl text-gray-800 mb-1">{item.score}</div>
              <div className="text-lg font-semibold text-blue-600">
                {item.percentage.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {item.count} jogo{item.count !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center bg-blue-50 border border-blue-200 p-3 rounded-lg">
          <p className="text-xs text-gray-700 flex items-center justify-center gap-2">
            <Database className="h-3 w-3 text-blue-600" />
            Baseado em dados históricos reais dos times na {homeStats.League_Name}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
