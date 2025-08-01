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
  const [data, setData] = useState({
    htFrequency: [] as ScoreItem[],
    ftFrequency: [] as ScoreItem[],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leagueMismatch, setLeagueMismatch] = useState(false);

  const parseCSV = (csv: string, scoreType: 'HT' | 'FT'): ScoreItem[] => {
    try {
      const lines = csv.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) return [];

      // Extrai cabeçalhos e encontra índices das colunas
      const headers = lines[0].split('\t').map(h => h.trim()); // Usando tabulação como delimitador
      
      const leagueIndex = headers.indexOf('League');
      const scoreIndex = headers.indexOf(scoreType === 'HT' ? 'HT_Score' : 'FT_Score');
      const matchesIndex = headers.indexOf('Matches');
      const percentageIndex = headers.indexOf('Percentage');

      // Validação dos índices
      if ([leagueIndex, scoreIndex, matchesIndex, percentageIndex].includes(-1)) {
        throw new Error('Estrutura do CSV inválida');
      }

      return lines.slice(1)
        .map(line => {
          const cols = line.split('\t'); // Usando tabulação como delimitador
          return {
            league: cols[leagueIndex]?.trim() || '',
            score: cols[scoreIndex]?.trim() || '',
            count: parseInt(cols[matchesIndex]?.trim() || '0', 10),
            percentage: cols[percentageIndex]?.trim() || '0%',
          };
        })
        .filter(item => item.score && !isNaN(item.count) && item.count > 0);
    } catch (err) {
      console.error('Erro ao parsear CSV:', err);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setLeagueMismatch(false);

        // Verificação de times da mesma liga
        if (homeTeam && awayTeam && homeTeam.league !== awayTeam.league) {
          setLeagueMismatch(true);
          setIsLoading(false);
          return;
        }

        const targetLeague = homeTeam?.league || awayTeam?.league;
        if (!targetLeague) {
          setIsLoading(false);
          return;
        }

        const [htRes, ftRes] = await Promise.all([
          fetch('https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/public/Data/half_time_scores.csv'),
          fetch('https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/public/Data/full_time_scores.csv'),
        ]);

        if (!htRes.ok || !ftRes.ok) {
          throw new Error('Erro ao carregar dados');
        }

        const [htText, ftText] = await Promise.all([
          htRes.text(),
          ftRes.text(),
        ]);

        // Filtra e ordena os dados
        const filterAndSort = (items: ScoreItem[]) => 
          items
            .filter(item => item.league === targetLeague)
            .sort((a, b) => b.count - a.count);

        setData({
          htFrequency: filterAndSort(parseCSV(htText, 'HT')),
          ftFrequency: filterAndSort(parseCSV(ftText, 'FT')),
        });

      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [homeTeam, awayTeam]);

  return {
    ...data,
    isLoading,
    error,
    leagueMismatch,
  };
};
