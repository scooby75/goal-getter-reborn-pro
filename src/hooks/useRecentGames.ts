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

const fetchCSVData = async (): Promise<string> => {
  const urls = ['/Data/all_leagues_results.csv'];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/csv,text/plain,*/*',
          'Cache-Control': 'no-cache',
        },
        mode: url.startsWith('http') ? 'cors' : 'same-origin',
      });

      if (response.ok) {
        const csvText = await response.text();
        if (csvText && csvText.trim().length > 100) {
          return csvText;
        }
      }
    } catch (error) {
      console.warn(`Erro na URL: ${url}`, error);
    }
  }

  throw new Error('Não foi possível carregar os dados dos jogos recentes');
};

const normalizeTeamName = (name: string): string => {
  return name.toLowerCase().trim();
};

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

  const matches: RecentGameMatch[] = rows.map((row) => {
    try {
      const scoreRaw = row.Score || row['Score'] || '';
      let homeGoals = 0;
      let awayGoals = 0;

      if (scoreRaw.includes('-')) {
        const [homeStr, awayStr] = scoreRaw.split('-').map(v => parseInt(v.trim()) || 0);
        homeGoals = homeStr;
        awayGoals = awayStr;
      }

      return {
        Date: row.Date || row.Data || '',
        Team_Home: row.HomeTeam || row.Team_Home || '',
        Team_Away: row.AwayTeam || row.Team_Away || '',
        Goals_Home: homeGoals,
        Goals_Away: awayGoals,
        Result: row.FullTimeResult || row.Result || '',
        Score: scoreRaw.trim(),
        HT_Score: row.HT_Score || row.HTScore || '',
        League: row.League || 'Indefinida',
      };
    } catch (error) {
      return null;
    }
  }).filter(Boolean) as RecentGameMatch[];

  return matches;
};

export const useRecentGames = (homeTeam?: string, awayTeam?: string) => {
  return useQuery<RecentGameMatch[]>({
    queryKey: ['recentGames', homeTeam, awayTeam],
    queryFn: async () => {
      const csvText = await fetchCSVData();
      const allMatches = parseRecentGamesCSV(csvText);

      let filteredMatches: RecentGameMatch[] = [];

      if (homeTeam) {
        const homeTeamNorm = normalizeTeamName(homeTeam);
        filteredMatches = [
          ...filteredMatches,
          ...allMatches.filter(match => 
            normalizeTeamName(match.Team_Home) === homeTeamNorm
          )
        ];
      }

      if (awayTeam) {
        const awayTeamNorm = normalizeTeamName(awayTeam);
        filteredMatches = [
          ...filteredMatches,
          ...allMatches.filter(match => 
            normalizeTeamName(match.Team_Away) === awayTeamNorm
          )
        ];
      }

      // Remove duplicates and sort by date (newest first)
      const uniqueMatches = filteredMatches
        .filter((match, index, self) =>
          index === self.findIndex(m =>
            m.Date === match.Date &&
            m.Team_Home === match.Team_Home &&
            m.Team_Away === match.Team_Away
          )
        )
        .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());

      // Return only the 6 most recent matches
      return uniqueMatches.slice(0, 6);
    },
    staleTime: 10 * 60 * 1000,
    retry: 2,
    enabled: !!homeTeam || !!awayTeam,
  });
};
