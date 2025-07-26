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
  console.log('=== FETCH RECENT GAMES CSV DATA ===');

  const urls = ['/Data/all_leagues_results.csv'];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'text/csv,text/plain,*/*',
          'Cache-Control': 'no-cache',
        },
        mode: url.startsWith('http') ? 'cors' : 'same-origin',
      });

      if (response.ok) {
        const csvText = await response.text();
        if (csvText.trim().length > 100) {
          console.log(`✅ CSV carregado com sucesso de: ${url}`);
          return csvText;
        }
      }

      console.warn(`❌ Falha na URL: ${url} - Status: ${response.status}`);
    } catch (error) {
      console.warn(`❌ Erro na URL: ${url}`, error);
    }
  }

  throw new Error('Não foi possível carregar os dados dos jogos recentes');
};

const parseRecentGamesCSV = (csvText: string): RecentGameMatch[] => {
  console.log('=== PARSE RECENT GAMES CSV ===');

  const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });

  if (!Array.isArray(result.data)) {
    console.error('Erro no parse CSV:', result.errors);
    return [];
  }

  return result.data.map((row: any, i) => {
    try {
      const scoreRaw = row.Score || '';
      let [homeGoals, awayGoals] = [0, 0];

      if (scoreRaw.includes('-')) {
        const [h, a] = scoreRaw.split('-').map(v => parseInt(v.trim()));
        homeGoals = isNaN(h) ? 0 : h;
        awayGoals = isNaN(a) ? 0 : a;
      }

      return {
        Date: row.Date || row.Data || '',
        Team_Home: row.HomeTeam || row.Team_Home || '',
        Team_Away: row.AwayTeam || row.Team_Away || '',
        Goals_Home: homeGoals,
        Goals_Away: awayGoals,
        Result: row.FullTimeResult || row.Result || '',
        Score: scoreRaw.trim(),
        HT_Score: row.HT_Score || row['HT Score'] || row.HTScore || '',
        League: row.League || 'Indefinida',
      };
    } catch (err) {
      console.warn(`❌ Erro ao processar linha ${i + 1}:`, err);
      return null;
    }
  }).filter(Boolean) as RecentGameMatch[];
};

export const useRecentGames = (homeTeam?: string, awayTeam?: string) => {
  return useQuery<{ homeRecentGames: RecentGameMatch[]; awayRecentGames: RecentGameMatch[] }>({
    queryKey: ['recentGames', homeTeam, awayTeam],
    queryFn: async () => {
      const csvText = await fetchCSVData();
      const allMatches = parseRecentGamesCSV(csvText);

      const homeRecentGames = allMatches
        .filter(m => m.Team_Home.toLowerCase() === (homeTeam?.toLowerCase() || ''))
        .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
        .slice(0, 6);

      const awayRecentGames = allMatches
        .filter(m => m.Team_Away.toLowerCase() === (awayTeam?.toLowerCase() || ''))
        .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
        .slice(0, 6);

      return { homeRecentGames, awayRecentGames };
    },
    staleTime: 10 * 60 * 1000,
    retry: 2,
    enabled: !!homeTeam || !!awayTeam,
  });
};
