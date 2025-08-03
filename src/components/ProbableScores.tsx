
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MarkovChainPrediction } from './MarkovChainPrediction';
import { EnhancedPoissonTab } from './EnhancedPoissonTab';
import { TeamStats } from '@/types/goalStats';
import { BarChart3, Activity } from 'lucide-react';

interface ProbableScoresProps {
  homeStats?: TeamStats;
  awayStats?: TeamStats;
}

export const ProbableScores: React.FC<ProbableScoresProps> = ({
  homeStats,
  awayStats,
}) => {
  return (
    <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-center text-xl text-gray-800 flex items-center justify-center gap-2">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          Modelo de Previsão Avançado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="poisson" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="poisson" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Poisson
            </TabsTrigger>
            <TabsTrigger value="avancado" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Avançado
            </TabsTrigger>
          </TabsList>

          <TabsContent value="poisson">
            <div className="bg-blue-50/30 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-700 text-center">
                Modelo clássico baseado na distribuição estatística de Poisson
              </p>
            </div>
            <EnhancedPoissonTab homeStats={homeStats} awayStats={awayStats} />
          </TabsContent>

          <TabsContent value="avancado">
            <div className="bg-purple-50/30 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-700 text-center">
                Modelo avançado com Cadeias de Markov e análise de padrões
              </p>
            </div>
            <MarkovChainPrediction homeStats={homeStats} awayStats={awayStats} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
