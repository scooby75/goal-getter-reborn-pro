import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Clock } from 'lucide-react';

interface ScoreItem {
  score: string;
  count: number;
  percentage: string;
}

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
  const [scores, setScores] = useState<ScoreItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const filePath =
      type === 'HT'
        ? 'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/public/Data/half_time_scores.csv'
        : 'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/public/Data/full_time_scores.csv';

    fetch(filePath)
      .then((res) => {
        if (!res.ok) throw new Error('Erro ao carregar CSV');
        return res.text();
      })
      .then((csvText) => {
        const lines = csvText.trim().split('\n');
        const header = lines[0].split(',');
        const scoreIndex = header.findIndex(h => h.toLowerCase().includes('score'));
        const countIndex = header.findIndex(h => h.toLowerCase().includes('match'));
        const percentIndex = header.findIndex(h => h.toLowerCase().includes('percent'));

        const data: ScoreItem[] = lines
          .slice(1)
          .map((line) => {
            const parts = line.split(',');
            return {
              score: parts[scoreIndex].trim(),
              count: parseInt(parts[countIndex].trim(), 10),
              percentage: parts[percentIndex].replace('%', '').trim(),
            };
          })
          .filter(item => item.score && !isNaN(item.count))
          .sort((a, b) => b.count - a.count)
          .slice(0, maxItems);

        setScores(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [type, maxItems]);

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
          <div className="text-center text-red-500">Erro ao carregar dados: {error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg">
      <CardHeader>
        <CardTitle className="text-center text-lg text-gray-800 flex items-center justify-center gap-2">
          {type === 'HT' ? <Clock className="h-5 w-5 text-blue-600" /> : <TrendingUp className="h-5 w-5 text-green-600" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {scores.map((item, index) => (
            <div key={`${item.score}-${index}`} className="text-center">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="text-lg font-bold text-gray-800 mb-1">
                  {item.score}
                </div>
                <div className="text-sm text-gray-600">
                  {item.percentage}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {item.count} jogos
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
