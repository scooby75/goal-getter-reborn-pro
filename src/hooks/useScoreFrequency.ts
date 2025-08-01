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
        // Caminhos corrigidos para os arquivos CSV
        const csvPaths = {
          HT: '/Data/half_time_scores.csv',
          FT: '/Data/full_time_scores.csv'
        };

        const [htRes, ftRes] = await Promise.all([
          fetch(csvPaths.HT),
          fetch(csvPaths.FT)
        ]);

        if (!htRes.ok) throw new Error(`Failed to load HT data: ${htRes.status}`);
        if (!ftRes.ok) throw new Error(`Failed to load FT data: ${ftRes.status}`);

        const [htText, ftText] = await Promise.all([htRes.text(), ftRes.text()]);

        const parseCsv = (csvText: string, type: 'HT' | 'FT'): ScoreItem[] => {
          const results = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
          });

          return (results.data as any[])
            .filter((row) => row.League === homeTeam.league)
            .map((row) => {
              // Garante que a porcentagem tenha o símbolo %
              let percentage = row.Percentage;
              if (!percentage.includes('%')) {
                percentage = `${percentage}%`;
              }

              return {
                score: type === 'HT' ? row.HT_Score : row.FT_Score,
                count: Number(row.Matches),
                percentage: percentage
              };
            })
            .sort((a, b) => b.count - a.count); // Ordena do mais frequente para o menos
        };

        const htData = parseCsv(htText, 'HT');
        const ftData = parseCsv(ftText, 'FT');

        setHtFrequency(htData);
        setFtFrequency(ftData);
      } catch (err) {
        console.error('Error loading score data:', err);
        setError('Erro ao carregar os dados de placares. Verifique o console para mais detalhes.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [homeTeam, awayTeam]);

  return { htFrequency, ftFrequency, isLoading, error, leagueMismatch };
}
