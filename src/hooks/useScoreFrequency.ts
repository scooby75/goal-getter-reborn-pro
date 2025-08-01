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
    const lines = csv.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    
    // Mapeamento das colunas específicas
    const leagueIndex = headers.indexOf('League');
    const scoreIndex = headers.indexOf(scoreType === 'HT' ? 'HT_Score' : 'FT_Score');
    const matchesIndex = headers.indexOf('Matches');
    const percentageIndex = headers.indexOf('Percentage');

    return lines.slice(1)
      .map(line => {
        const cols = line.split(',');
        return {
          league: cols[leagueIndex]?.trim() || '',
          score: cols[scoreIndex]?.trim() || '',
          count: parseInt(cols[matchesIndex]?.trim() || '0', 10),
          percentage: cols[percentageIndex]?.includes('%') 
            ? cols[percentageIndex].trim() 
            : `${cols[percentageIndex]?.trim()}%`,
        };
      })
      .filter(item => item.score && !isNaN(item.count) && item.count > 0);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setLeagueMismatch(false);

        // Verificar se há times selecionados
        if (!homeTeam || !awayTeam) {
          setData({ htFrequency: [], ftFrequency: [] });
          setIsLoading(false);
          return;
        }

        // Verificar se os times são da mesma liga
        if (homeTeam.league !== awayTeam.league) {
          setLeagueMismatch(true);
          setData({ htFrequency: [], ftFrequency: [] });
          setIsLoading(false);
          return;
        }

        // Normalizar o nome da liga para corresponder aos dados do CSV
        const leagueMap: Record<string, string> = {
          'Brazil - Serie A': 'Brasileirão',
          'Premier League': 'Premier League',
          // Adicione outros mapeamentos conforme necessário
        };

        const targetLeague = leagueMap[homeTeam.league] || homeTeam.league;

        const [htRes, ftRes] = await Promise.all([
          fetch('https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/c3394f75ca7389fb5e489ddace66cb8cfdb4650f/public/Data/half_time_scores.csv'),
          fetch('https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/c3394f75ca7389fb5e489ddace66cb8cfdb4650f/public/Data/full_time_scores.csv'),
        ]);

        if (!htRes.ok || !ftRes.ok) {
          throw new Error('Erro ao carregar dados históricos');
        }

        const [htText, ftText] = await Promise.all([
          htRes.text(),
          ftRes.text(),
        ]);

        // Filtrar apenas os dados da liga específica
        const filterByLeague = (items: ScoreItem[]) => 
          items.filter(item => item.league === targetLeague)
               .sort((a, b) => b.count - a.count)
               .slice(0, 10); // Limitar a top 10 resultados

        setData({
          htFrequency: filterByLeague(parseCSV(htText, 'HT')),
          ftFrequency: filterByLeague(parseCSV(ftText, 'FT')),
        });

      } catch (err) {
        console.error('Erro ao processar dados:', err);
        setError('Erro ao carregar dados de placares');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [homeTeam, awayTeam]);

  return {
    ...data,
    isLoading,
    error: leagueMismatch ? 'Times de ligas diferentes - dados não disponíveis' : error,
    leagueMismatch,
  };
};
