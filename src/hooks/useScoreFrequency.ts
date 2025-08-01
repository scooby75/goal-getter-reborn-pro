
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

        const parseCSV = (csv: string): ScoreItem[] => {
          const lines = csv.trim().split('\n');
          const header = lines[0].split(',');
          
          // Encontrar os índices das colunas necessárias
          const scoreIndex = header.findIndex(h => 
            h.toLowerCase().includes('score') || h.toLowerCase().includes('placar')
          );
          const matchesIndex = header.findIndex(h => 
            h.toLowerCase().includes('match') || h.toLowerCase().includes('partida') || h.toLowerCase().includes('jogos')
          );
          const percentageIndex = header.findIndex(h => 
            h.toLowerCase().includes('percent') || h.toLowerCase().includes('porcentagem')
          );

          console.log('Header:', header);
          console.log('Indices encontrados - Score:', scoreIndex, 'Matches:', matchesIndex, 'Percentage:', percentageIndex);

          return lines.slice(1) // remove cabeçalho
            .map(line => {
              const cols = line.split(',');
              const score = cols[scoreIndex]?.trim() || '';
              const countStr = cols[matchesIndex]?.trim() || '0';
              const percentageStr = cols[percentageIndex]?.replace('%', '').trim() || '0';
              
              return {
                score: score,
                count: parseInt(countStr, 10),
                percentage: percentageStr,
              };
            })
            .filter(item => item.score && !isNaN(item.count) && item.count > 0)
            .sort((a, b) => b.count - a.count); // ordenar por número de jogos
        };

        const htData = parseCSV(htText);
        const ftData = parseCSV(ftText);
        
        console.log('HT Data sample:', htData.slice(0, 5));
        console.log('FT Data sample:', ftData.slice(0, 5));

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
