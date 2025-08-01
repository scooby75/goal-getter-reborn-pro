import { useEffect, useState } from 'react';

interface ScoreItem {
  league: string;
  score: string;
  count: number;
  percentage: string;
}

interface TeamData {
  name: string;
  league: string;
}

interface ScoreFrequencyData {
  htFrequency: ScoreItem[];
  ftFrequency: ScoreItem[];
  isLoading: boolean;
  error: string | null;
  leagueMismatch: boolean;
}

export const useScoreFrequency = (homeTeam: TeamData | null, awayTeam: TeamData | null): ScoreFrequencyData => {
  const [data, setData] = useState<Omit<ScoreFrequencyData, 'isLoading' | 'error' | 'leagueMismatch'>>({
    htFrequency: [],
    ftFrequency: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leagueMismatch, setLeagueMismatch] = useState(false);

  const parseCSV = (csv: string, scoreColumnName: string, targetLeague: string): ScoreItem[] => {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    
    const leagueIndex = headers.indexOf('League');
    const scoreIndex = headers.indexOf(scoreColumnName);
    const matchesIndex = headers.indexOf('Matches');
    const percentageIndex = headers.indexOf('Percentage');

    if ([leagueIndex, scoreIndex, matchesIndex, percentageIndex].some(i => i === -1)) {
      throw new Error(`CSV não contém colunas necessárias`);
    }

    return lines.slice(1)
      .map(line => {
        const cols = line.split(',');
        return {
          league: cols[leagueIndex]?.trim() || '',
          score: cols[scoreIndex]?.trim() || '',
          count: parseInt(cols[matchesIndex]?.trim() || '0', 10),
          percentage: cols[percentageIndex]?.trim() || '0%',
        };
      })
      .filter(item => 
        item.score && 
        !isNaN(item.count) && 
        item.count > 0 &&
        item.league === targetLeague
      )
      .sort((a, b) => b.count - a.count);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setLeagueMismatch(false);

        // Verificar se os times são da mesma liga
        if (homeTeam && awayTeam && homeTeam.league !== awayTeam.league) {
          setLeagueMismatch(true);
          setData({ htFrequency: [], ftFrequency: [] });
          setIsLoading(false);
          return;
        }

        const targetLeague = homeTeam?.league || awayTeam?.league;
        if (!targetLeague) {
          setData({ htFrequency: [], ftFrequency: [] });
          setIsLoading(false);
          return;
        }

        const [htRes, ftRes] = await Promise.all([
          fetch('https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/c3394f75ca7389fb5e489ddace66cb8cfdb4650f/public/Data/half_time_scores.csv'),
          fetch('https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/c3394f75ca7389fb5e489ddace66cb8cfdb4650f/public/Data/full_time_scores.csv'),
        ]);

        if (!htRes.ok || !ftRes.ok) {
          throw new Error('Falha ao carregar dados históricos');
        }

        const [htText, ftText] = await Promise.all([
          htRes.text(),
          ftRes.text(),
        ]);

        setData({
          htFrequency: parseCSV(htText, 'HT_Score', targetLeague),
          ftFrequency: parseCSV(ftText, 'FT_Score', targetLeague),
        });
      } catch (err) {
        console.error('Erro ao processar dados:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [homeTeam, awayTeam]);

  return {
    htFrequency: data.htFrequency,
    ftFrequency: data.ftFrequency,
    isLoading,
    error: leagueMismatch ? 'Os times são de ligas diferentes - dados não disponíveis' : error,
    leagueMismatch,
  };
};
