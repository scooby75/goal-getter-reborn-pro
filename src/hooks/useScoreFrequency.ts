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
  const [data, setData] = useState<ScoreFrequencyData>({
    htFrequency: [],
    ftFrequency: [],
    isLoading: true,
    error: null,
    leagueMismatch: false,
  });

  const parseCSV = (text: string): ScoreItem[] => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    // Remove BOM character if exists
    const headerLine = lines[0].replace(/^\uFEFF/, '');
    const headers = headerLine.split(',').map(h => h.trim());

    const leagueIndex = headers.indexOf('League');
    const scoreIndex = headers.indexOf('FT_Score');
    const matchesIndex = headers.indexOf('Matches');
    const percentageIndex = headers.indexOf('Percentage');

    // Validate headers
    if ([leagueIndex, scoreIndex, matchesIndex, percentageIndex].includes(-1)) {
      console.error('Cabeçalhos do CSV não correspondem ao esperado:', headers);
      return [];
    }

    return lines.slice(1).map(line => {
      const cols = line.split(',');
      return {
        league: cols[leagueIndex]?.trim() || '',
        score: cols[scoreIndex]?.trim() || '',
        count: parseInt(cols[matchesIndex]?.trim() || '0', 10),
        percentage: cols[percentageIndex]?.trim() || '0%',
      };
    }).filter(item => item.score && !isNaN(item.count) && item.count > 0);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setData(prev => ({ ...prev, isLoading: true, error: null }));

        if (homeTeam && awayTeam && homeTeam.league !== awayTeam.league) {
          setData(prev => ({ ...prev, leagueMismatch: true, isLoading: false }));
          return;
        }

        const targetLeague = homeTeam?.league || awayTeam?.league;
        if (!targetLeague) {
          setData(prev => ({ ...prev, isLoading: false }));
          return;
        }

        // Carrega ambos arquivos simultaneamente
        const [htResponse, ftResponse] = await Promise.all([
          fetch('/Data/half_time_scores.csv'),
          fetch('/Data/full_time_scores.csv'),
        ]);

        if (!htResponse.ok || !ftResponse.ok) {
          throw new Error('Não foi possível carregar os arquivos de dados');
        }

        const [htText, ftText] = await Promise.all([
          htResponse.text(),
          ftResponse.text(),
        ]);

        // DEBUG: Mostra parte dos dados crus
        console.log('Dados HT (amostra):', htText.substring(0, 200));
        console.log('Dados FT (amostra):', ftText.substring(0, 200));

        const normalizeLeagueName = (name: string) => {
          return name.trim().toLowerCase()
            .replace(/-/g, ' ')
            .replace(/\s+/g, ' ')
            .replace('serie a', '')
            .trim();
        };

        const targetNormalized = normalizeLeagueName(targetLeague);

        const filterData = (items: ScoreItem[]) => 
          items
            .filter(item => normalizeLeagueName(item.league) === targetNormalized)
            .sort((a, b) => b.count - a.count);

        setData({
          htFrequency: filterData(parseCSV(htText)),
          ftFrequency: filterData(parseCSV(ftText)),
          isLoading: false,
          error: null,
          leagueMismatch: false,
        });

      } catch (err) {
        console.error('Erro ao processar dados:', err);
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Erro desconhecido',
        }));
      }
    };

    fetchData();
  }, [homeTeam, awayTeam]);

  return data;
};
