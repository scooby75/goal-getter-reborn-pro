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

  const parseCSV = (text: string, scoreType: 'HT' | 'FT'): ScoreItem[] => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    // Detecta delimitador (vírgula ou tab)
    const delimiter = lines[0].includes('\t') ? '\t' : ',';
    const headers = lines[0].split(delimiter).map(h => h.trim());

    const getIndex = (names: string[]) => 
      names.reduce((acc, name) => 
        acc !== -1 ? acc : headers.findIndex(h => h.toLowerCase() === name.toLowerCase()), -1);

    const leagueIndex = getIndex(['league', 'liga']);
    const scoreIndex = getIndex([scoreType === 'HT' ? 'ht_score' : 'ft_score', 'score']);
    const matchesIndex = getIndex(['matches', 'jogos']);
    const percentageIndex = getIndex(['percentage', 'porcentagem']);

    return lines.slice(1).map(line => {
      const cols = line.split(delimiter);
      return {
        league: cols[leagueIndex]?.trim() || '',
        score: cols[scoreIndex]?.trim() || '',
        count: parseInt(cols[matchesIndex]?.trim() || '0', 10),
        percentage: cols[percentageIndex]?.trim().includes('%') 
          ? cols[percentageIndex].trim() 
          : `${cols[percentageIndex]?.trim()}%`,
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

        // Carrega arquivos locais
        const [htResponse, ftResponse] = await Promise.all([
          fetch('/Data/half_time_scores.csv'),
          fetch('/Data/full_time_scores.csv'),
        ]);

        if (!htResponse.ok || !ftResponse.ok) {
          throw new Error('Arquivos CSV não encontrados');
        }

        const [htText, ftText] = await Promise.all([
          htResponse.text(),
          ftResponse.text(),
        ]);

        console.log('Dados HT:', htText.substring(0, 200));
        console.log('Dados FT:', ftText.substring(0, 200));

        const normalizeLeague = (name: string) => 
          name.toLowerCase().replace(/\s+/g, '').replace('serie', '');

        const filterData = (items: ScoreItem[]) => 
          items
            .filter(item => normalizeLeague(item.league) === normalizeLeague(targetLeague))
            .sort((a, b) => b.count - a.count);

        setData({
          htFrequency: filterData(parseCSV(htText, 'HT')),
          ftFrequency: filterData(parseCSV(ftText, 'FT')),
          isLoading: false,
          error: null,
          leagueMismatch: false,
        });

      } catch (err) {
        console.error('Erro ao carregar dados:', err);
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
