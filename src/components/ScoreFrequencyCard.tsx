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
          fetch('/Data/half_time_scores.csv'),
          fetch('/Data/full_time_scores.csv'),
        ]);

        if (!htRes.ok || !ftRes.ok) {
          throw new Error('Erro ao carregar os arquivos de placares');
        }

        const htText = await htRes.text();
        const ftText = await ftRes.text();

        const parseCSV = (csv: string): ScoreItem[] => {
          return csv
            .trim()
            .split('\n')
            .slice(1) // remove cabeçalho
            .map(line => {
              const [_, score, count, percentage] = line.split(',');
              return {
                score: score.trim(),
                count: parseInt(count.trim(), 10),
                percentage: percentage.replace('%', '').trim(),
              };
            });
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
