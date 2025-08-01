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
      if (!homeTeam || !awayTeam) return;

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

        const parseCsv = (csvText: string): ScoreItem[] => {
          const parsed = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
          });

          return (parsed.data as any[])
            .filter((row) => {
              const isRelevant =
                row.League === homeTeam.league &&
                ((row.Home === homeTeam.name && row.Away === awayTeam.name) ||
                  (row.Home === awayTeam.name && row.Away === homeTeam.name));
              return isRelevant;
            })
            .map((row) => ({
              score: row.Score,
              count: Number(row.Count),
              percentage: row.Percentage,
            }));
        };

        const htData = parseCsv(htText);
        const ftData = parseCsv(ftText);

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
