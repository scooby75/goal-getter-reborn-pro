import { useEffect, useState } from 'react';
import Papa from 'papaparse';

interface ScoreItem {
  score: string;
  count: number;
  percentage: string;
}

export function useScoreFrequency(
  homeTeam: { name: string; league: string } | null,
  awayTeam: { name: string; league: string } | null
) {
  const [htFrequency, setHtFrequency] = useState<ScoreItem[]>([]);
  const [ftFrequency, setFtFrequency] = useState<ScoreItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leagueMismatch, setLeagueMismatch] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!homeTeam || !awayTeam || !homeTeam.league || !awayTeam.league) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setLeagueMismatch(false);

      if (homeTeam.league !== awayTeam.league) {
        setLeagueMismatch(true);
        setIsLoading(false);
        return;
      }

      try {
        const [htRes, ftRes] = await Promise.all([
          fetch(
            'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/public/Data/half_time_scores.csv'
          ),
          fetch(
            'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/public/Data/full_time_scores.csv'
          ),
        ]);

        const [htText, ftText] = await Promise.all([htRes.text(), ftRes.text()]);

        const parseCsv = (csvText: string, type: 'HT' | 'FT'): ScoreItem[] => {
          const parsed = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
          });

          return (parsed.data as any[])
            .filter((row) => row.League === homeTeam.league)
            .map((row) => ({
              score: type === 'HT' ? row.HT_Score : row.FT_Score,
              count: Number(row.Matches),
              percentage: row.Percentage,
            }));
        };

        const htData = parseCsv(htText, 'HT');
        const ftData = parseCsv(ftText, 'FT');

        setHtFrequency(htData);
        setFtFrequency(ftData);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar os dados.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [homeTeam, awayTeam]);

  return { htFrequency, ftFrequency, isLoading, error, leagueMismatch };
}
