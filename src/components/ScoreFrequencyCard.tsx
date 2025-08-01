
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Clock } from 'lucide-react';
import { useScoreFrequency } from '@/hooks/useScoreFrequency';

interface ScoreFrequencyCardProps {
  type: 'HT' | 'FT';
  title: string;
  maxItems: number;
}

export const ScoreFrequencyCard: React.FC<ScoreFrequencyCardProps> = ({ 
  type, 
  title, 
  maxItems 
}) => {
  const { htFrequency, ftFrequency, isLoading, error } = useScoreFrequency();
  
  if (isLoading) {
    return (
      <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-lg text-gray-800 flex items-center justify-center gap-2">
            {type === 'HT' ? <Clock className="h-5 w-5 text-blue-600" /> : <TrendingUp className="h-5 w-5 text-green-600" />}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">Carregando dados...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-lg text-gray-800 flex items-center justify-center gap-2">
            {type === 'HT' ? <Clock className="h-5 w-5 text-blue-600" /> : <TrendingUp className="h-5 w-5 text-green-600" />}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500">Erro ao carregar dados</div>
        </CardContent>
      </Card>
    );
  }

  const frequency = type === 'HT' ? htFrequency : ftFrequency;
  const topScores = frequency.slice(0, maxItems);

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg">
      <CardHeader>
        <CardTitle className="text-center text-lg text-gray-800 flex items-center justify-center gap-2">
          {type === 'HT' ? <Clock className="h-5 w-5 text-blue-600" /> : <TrendingUp className="h-5 w-5 text-green-600" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop Layout */}
        <div className="hidden md:block">
          <div className="grid grid-cols-4 gap-3">
            {topScores.map((item, index) => (
              <div key={item.score} className="text-center">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="text-lg font-bold text-gray-800 mb-1">
                    {item.score}
                  </div>
                  <div className="text-sm text-gray-600">
                    {item.percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="block md:hidden">
          <div className="grid grid-cols-2 gap-3">
            {topScores.map((item, index) => (
              <div key={item.score} className="text-center">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="text-lg font-bold text-gray-800 mb-1">
                    {item.score}
                  </div>
                  <div className="text-sm text-gray-600">
                    {item.percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
