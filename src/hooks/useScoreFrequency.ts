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
          fetch('https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/public/Data/half_time_scores.csv'),
          fetch('https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/public/Data/full_time_scores.csv'),
        ]);

        if (!htRes.ok || !ftRes.ok) {
          throw new Error('Erro ao carregar os arquivos de placares');
        }

        const htText = await htRes.text();
        const ftText = await ftRes.text();

        const parseCSV = (csv: string): ScoreItem[] => {
          const lines = csv.trim().split('\n');
          const header = lines[0].split(','); // League, HT_Score, Matches, Percentage
          const scoreIndex = header.findIndex(h => h.includes('Score'));
          const matchesIndex = header.findIndex(h => h.toLowerCase().includes('match'));
          const percentageIndex = header.findIndex(h => h.toLowerCase().includes('percent'));

          return lines.slice(1) // remove cabeçalho
            .map(line => {
              const cols = line.split(',');
              return {
                score: cols[scoreIndex].trim(),
                count: parseInt(cols[matchesIndex].trim(), 10),
                percentage: cols[percentageIndex].replace('%', '').trim(),
              };
            })
            .filter(item => item.score && !isNaN(item.count))
            .sort((a, b) => b.count - a.count); // ordenar por número de jogos
        };

        setHtFrequency(parseCSV(htText));
        setFtFrequency(parseCSV(ftText));
      } catch (err) {
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
