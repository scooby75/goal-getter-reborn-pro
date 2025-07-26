import { useQuery } from '@tanstack/react-query';
import Papa from 'papaparse';

export type RecentGameMatch = {
  Date: string;
  Team_Home: string;
  Team_Away: string;
  Goals_Home: number;
  Goals_Away: number;
  Result: string;
  Score?: string;
  HT_Score?: string;
  Status?: string;
  League?: string;
};

export type GameStats = {
  averageGoalsFor: number;
  averageGoalsAgainst: number;
  wins: number;
  draws: number;
  losses: number;
};

// Normaliza string para facilitar comparações (minusculo, sem acento e trim)
const normalize = (str: string): string =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

// Função para buscar CSV
const fetchCSVData = async (): Promise<string> => {
  const url = '/Data/all_leagues_results.csv';
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'text/csv,text/plain,*/*',
      'Cache-Control': 'no-cache',
    },
    mode: url.startsWith('http') ? 'cors' : 'same-origin',
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar CSV: ${response.statusText}`);
  }

  const csvText = await response.text();
  if (csvText.length < 100) throw new Error('CSV vazio ou muito pequeno');

  return csvText;
};

// Parse CSV robusto baseado no código original
const parseRecentGamesCSV = (csvText: string): RecentGameMatch[] => {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors.length) {
    console.error('Erros ao parsear CSV:', result.errors);
    return [];
  }

  const rows = result.data as any[];

  const matches: RecentGameMatch[] = rows
    .map((row, index) => {
      try {
        const scoreRaw = row.Score || '';
        let homeGoals = 0;
        let awayGoals = 0;

        if (scoreRaw.includes('-')) {
          const [homeStr, awayStr] = scoreRaw.split('-').map(v => v.trim());
          homeGoals = parseInt(homeStr);
          awayGoals = parseInt(awayStr);
        }

        return {
          Date: row.Date || '',
          Team_Home: row.HomeTeam || '',
          Team_Away: row.AwayTeam || '',
          Goals_Home: isNaN(homeGoals) ? 0 : homeGoals,
          Goals_Away: isNaN(awayGoals) ? 0 : awayGoals,
          Result: row.FullTimeResult || '',
          Score: scoreRaw.trim(),
          HT_Score: row.HT_Score || '',
          League: row.League || 'Indefinida',
        };
      } catch (error) {
        console.warn(`Erro ao processar linha ${index + 1}:`, error);
        return null;
      }
    })
    .filter(Boolean);

  return matches;
};

// Cálculo de estatísticas (média gols, vitórias, empates, derrotas)
const calculateStats = (games: RecentGameMatch[], type: 'home' | 'away'): GameStats => {
  let goalsFor = 0;
  let goalsAgainst = 0;
  let wins = 0;
  let draws = 0;
  let losses = 0;

  games.forEach(game => {
    const gf = type === 'home' ? game.Goals_Home : game.Goals_Away;
    const ga = type === 'home' ? game.Goals_Away : game.Goals_Home;

    goalsFor += gf;
    goalsAgainst += ga;

    if (gf > ga) wins++;
    else if (gf === ga) draws++;
    else losses++;
  });

  const count = games.length || 1;
  return {
    averageGoalsFor: parseFloat((goalsFor / count).toFixed(2)),
    averageGoalsAgainst: parseFloat((goalsAgainst / count).toFixed(2)),
    wins,
    draws,
    losses,
  };
};

export const useRecentGames = (
  homeTeam?: string,
  awayTeam?: string,
  homeLimit = 6,
  awayLimit = 6
) => {
  return useQuery<{
    homeGames: RecentGameMatch[];
    awayGames: RecentGameMatch[];
    homeStats?: GameStats;
    awayStats?: GameStats;
  }>({
    queryKey: ['recentGamesStats', homeTeam, awayTeam, homeLimit, awayLimit],
    queryFn: async () => {
      const csvText = await fetchCSVData();
      const allMatches = parseRecentGamesCSV(csvText);

      if (!Array.isArray(allMatches)) {
        throw new Error('allMatches não é um array');
      }

      const homeTeamNorm = homeTeam ? normalize(homeTeam) : '';
      const awayTeamNorm = awayTeam ? normalize(awayTeam) : '';

      const homeGames = homeTeam
        ? allMatches
            .filter(m => normalize(m.Team_Home).includes(homeTeamNorm))
            .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
            .slice(0, homeLimit)
        : [];

      const awayGames = awayTeam
        ? allMatches
            .filter(m => normalize(m.Team_Away).includes(awayTeamNorm))
            .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
            .slice(0, awayLimit)
        : [];

      return {
        homeGames,
        awayGames,
        homeStats: homeGames.length ? calculateStats(homeGames, 'home') : undefined,
        awayStats: awayGames.length ? calculateStats(awayGames, 'away') : undefined,
      };
    },
    staleTime: 10 * 60 * 1000,
    retry: 2,
    enabled: !!homeTeam || !!awayTeam,
  });
};
