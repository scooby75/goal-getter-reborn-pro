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

const normalize = (str: string): string =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const fetchCSVData = async (): Promise<string> => {
  const url = '/Data/all_leagues_results.csv';
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'text/csv,text/plain,*/*',
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

const parseRecentGamesCSV = (csvText: string): RecentGameMatch[] => {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const rows = result.data as any[];

  const matches: RecentGameMatch[] = rows.map((row) => {
    const scoreRaw = row.Score || '';
    let homeGoals = 0;
    let awayGoals = 0;

    if (scoreRaw.includes('-')) {
      const [homeStr, awayStr] = scoreRaw.split('-').map(v => v.trim());
      homeGoals = parseInt(homeStr) || 0;
      awayGoals = parseInt(awayStr) || 0;
    }

    return {
      Date: row.Date || '',
      Team_Home: row.HomeTeam || '',
      Team_Away: row.AwayTeam || '',
      Goals_Home: homeGoals,
      Goals_Away: awayGoals,
      Result: row.FullTimeResult || '',
      Score: scoreRaw,
      HT_Score: row.HT_Score || '',
      League: row.League || 'Indefinida',
    };
  }).filter(m => m.Date && m.Team_Home && m.Team_Away);

  return matches;
};

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
  homeLimit: number = 6,
  awayLimit: number = 6
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

      const homeTeamNorm = homeTeam ? normalize(homeTeam) : '';
      const awayTeamNorm = awayTeam ? normalize(awayTeam) : '';

      const homeGames = homeTeam
        ? allMatches
            .filter(m => normalize(m.Team_Home) === homeTeamNorm)
            .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
            .slice(0, homeLimit)
        : [];

      const awayGames = awayTeam
        ? allMatches
            .filter(m => normalize(m.Team_Away) === awayTeamNorm)
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
