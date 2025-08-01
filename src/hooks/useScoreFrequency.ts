import { useEffect, useState } from 'react';

interface ScoreItem {
  league: string;
  score: string;
  count: number;
  percentage: string; // Will include % symbol
}

interface ScoreFrequencyData {
  htFrequency: ScoreItem[];
  ftFrequency: ScoreItem[];
  isLoading: boolean;
  error: Error | null;
}

export const useScoreFrequency = (leagueFilter?: string): ScoreFrequencyData => {
  const [data, setData] = useState<Omit<ScoreFrequencyData, 'isLoading' | 'error'>>({
    htFrequency: [],
    ftFrequency: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const parseCSV = (csv: string, scoreColumnName: string): ScoreItem[] => {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];

    // Extract and normalize headers
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Find column indices
    const leagueIndex = headers.indexOf('League');
    const scoreIndex = headers.indexOf(scoreColumnName);
    const matchesIndex = headers.indexOf('Matches');
    const percentageIndex = headers.indexOf('Percentage');

    // Validate column indices
    if ([leagueIndex, scoreIndex, matchesIndex, percentageIndex].some(i => i === -1)) {
      throw new Error(`Missing required columns in CSV data`);
    }

    return lines.slice(1)
      .map(line => {
        const cols = line.split(',');
        return {
          league: cols[leagueIndex]?.trim() || '',
          score: cols[scoreIndex]?.trim() || '',
          count: parseInt(cols[matchesIndex]?.trim() || '0', 10),
          percentage: cols[percentageIndex]?.trim() || '0%', // Keep % symbol
        };
      })
      .filter(item => 
        item.score && 
        !isNaN(item.count) && 
        item.count > 0 &&
        (!leagueFilter || item.league === leagueFilter) // Filter by league if specified
      )
      .sort((a, b) => b.count - a.count);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [htRes, ftRes] = await Promise.all([
          fetch('https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/c3394f75ca7389fb5e489ddace66cb8cfdb4650f/public/Data/half_time_scores.csv'),
          fetch('https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/c3394f75ca7389fb5e489ddace66cb8cfdb4650f/public/Data/full_time_scores.csv'),
        ]);

        if (!htRes.ok || !ftRes.ok) {
          throw new Error('Failed to load score data files');
        }

        const [htText, ftText] = await Promise.all([
          htRes.text(),
          ftRes.text(),
        ]);

        setData({
          htFrequency: parseCSV(htText, 'HT_Score'),
          ftFrequency: parseCSV(ftText, 'FT_Score'),
        });
      } catch (err) {
        console.error('Error processing score frequency data:', err);
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [leagueFilter]); // Re-fetch when leagueFilter changes

  return {
    htFrequency: data.htFrequency,
    ftFrequency: data.ftFrequency,
    isLoading,
    error,
  };
};
