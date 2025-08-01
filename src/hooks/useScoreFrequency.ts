
import { useEffect, useState } from 'react';

interface ScoreItem {
  score: string;
  count: number;
  percentage: string;
}

interface ScoreFrequencyData {
  htFrequency: ScoreItem[];
  ftFrequency: ScoreItem[];
  isLoading: boolean;
  error: Error | null;
}

export const useScoreFrequency = (): ScoreFrequencyData => {
  const [htFrequency, setHtFrequency] = useState<ScoreItem[]>([]);
  const [ftFrequency, setFtFrequency] = useState<ScoreItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [htRes, ftRes] = await Promise.all([
          fetch('https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/c3394f75ca7389fb5e489ddace66cb8cfdb4650f/public/Data/half_time_scores.csv'),
          fetch('https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/c3394f75ca7389fb5e489ddace66cb8cfdb4650f/public/Data/full_time_scores.csv'),
        ]);

        if (!htRes.ok || !ftRes.ok) {
          throw new Error('Erro ao carregar os arquivos de placares');
        }

        const htText = await htRes.text();
        const ftText = await ftRes.text();

        const parseHalfTimeCSV = (csv: string): ScoreItem[] => {
          const lines = csv.trim().split('\n');
          const header = lines[0].split(',');
          
          console.log('HT Header:', header);
          
          // Para half_time_scores.csv: League,HT_Score,Matches,Percentage
          const leagueIndex = 0;
          const scoreIndex = 1; // HT_Score
          const matchesIndex = 2; // Matches
          const percentageIndex = 3; // Percentage

          return lines.slice(1) // remove cabeçalho
            .map(line => {
              const cols = line.split(',');
              const league = cols[leagueIndex]?.trim() || '';
              const score = cols[scoreIndex]?.trim() || '';
              const countStr = cols[matchesIndex]?.trim() || '0';
              const percentageStr = cols[percentageIndex]?.replace('%', '').trim() || '0';
              
              return {
                league,
                score: score,
                count: parseInt(countStr, 10),
                percentage: percentageStr,
              };
            })
            .filter(item => item.score && !isNaN(item.count) && item.count > 0)
            .sort((a, b) => b.count - a.count); // ordenar por número de jogos
        };

        const parseFullTimeCSV = (csv: string): ScoreItem[] => {
          const lines = csv.trim().split('\n');
          const header = lines[0].split(',');
          
          console.log('FT Header:', header);
          
          // Para full_time_scores.csv: League,FT_Score,Matches,Percentage
          const leagueIndex = 0;
          const scoreIndex = 1; // FT_Score
          const matchesIndex = 2; // Matches
          const percentageIndex = 3; // Percentage

          return lines.slice(1) // remove cabeçalho
            .map(line => {
              const cols = line.split(',');
              const league = cols[leagueIndex]?.trim() || '';
              const score = cols[scoreIndex]?.trim() || '';
              const countStr = cols[matchesIndex]?.trim() || '0';
              const percentageStr = cols[percentageIndex]?.replace('%', '').trim() || '0';
              
              return {
                league,
                score: score,
                count: parseInt(countStr, 10),
                percentage: percentageStr,
              };
            })
            .filter(item => item.score && !isNaN(item.count) && item.count > 0)
            .sort((a, b) => b.count - a.count); // ordenar por número de jogos
        };

        const htData = parseHalfTimeCSV(htText);
        const ftData = parseFullTimeCSV(ftText);
        
        console.log('HT Data sample:', htData.slice(0, 10));
        console.log('FT Data sample:', ftData.slice(0, 10));

        setHtFrequency(htData);
        setFtFrequency(ftData);
      } catch (err) {
        console.error('Erro ao processar dados de frequência de placares:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    htFrequency,
    ftFrequency,
    isLoading,
    error,
  };
};
