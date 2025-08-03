
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdvancedPredictionTab } from './AdvancedPredictionTab';
import { TeamStats } from '@/types/goalStats';
import { Brain } from 'lucide-react';

interface ProbableScoresProps {
  homeStats?: TeamStats;
  awayStats?: TeamStats;
}

export const ProbableScores: React.FC<ProbableScoresProps> = ({
  homeStats,
  awayStats,
}) => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-center text-2xl text-gray-800 flex items-center justify-center gap-2">
          <Brain className="h-6 w-6 text-blue-600" />
          Modelo de Previsão Avançado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="avancado" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="poisson">Poisson</TabsTrigger>
            <TabsTrigger value="avancado">Avançado</TabsTrigger>
          </TabsList>
          
          <TabsContent value="poisson" className="mt-6">
            <div className="text-center py-8 text-gray-500">
              <p>Modelo Poisson tradicional será implementado aqui</p>
            </div>
          </TabsContent>
          
          <TabsContent value="avancado" className="mt-6">
            <AdvancedPredictionTab 
              homeStats={homeStats} 
              awayStats={awayStats} 
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
