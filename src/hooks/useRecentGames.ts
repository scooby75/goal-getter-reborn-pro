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
      console.log(`🔄 Tentando URL: ${url}`);

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
        if (csvText.trim().length > 100) {
          console.log(`✅ CSV carregado com sucesso de: ${url}`);
          console.log(`📊 Tamanho do CSV: ${csvText.length} caracteres`);
          return csvText;
        }
      }

      console.warn(`❌ Falha na URL: ${url} - Status: ${response.status}`);
    } catch (error) {
      console.warn(`❌ Erro na URL: ${url}`, error);
    }
  }

  throw new Error('Não foi possível carregar os dados dos jogos recentes de nenhuma fonte disponível');
};

const parseRecentGamesCSV = (csvText: string): RecentGameMatch[] => {
  const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });

  if (result.errors.length) {
    console.error('Erros ao parsear CSV:', result.errors);
    return [];
  }

  return result.data.map((row: any, index: number) => {
    try {
      const scoreRaw = row.Score || row['Score'] || '';
      let homeGoals = 0;
      let awayGoals = 0;

      if (scoreRaw.includes('-')) {
        const [homeStr, awayStr] = scoreRaw.split('-').map((v) => v.trim());
        homeGoals = parseInt(homeStr);
        awayGoals = parseInt(awayStr);
      }

      return {
        Date: row.Date || row.Data || '',
        Team_Home: row.HomeTeam || row.Team_Home || '',
        Team_Away: row.AwayTeam || row.Team_Away || '',
        Goals_Home: isNaN(homeGoals) ? 0 : homeGoals,
        Goals_Away: isNaN(awayGoals) ? 0 : awayGoals,
        Result: row.FullTimeResult || row.Result || row.Resultado || '',
        Score: scoreRaw.trim(),
        HT_Score: row.HT_Score || row.HTScore || row['HT Score'] || '',
        League: row.League || 'Indefinida',
      };
    } catch (error) {
      console.warn(`❌ Erro ao processar linha ${index + 1}:`, error);
      return null;
    }
  }).filter(Boolean) as RecentGameMatch[];
};

const safeDate = (dateStr: string): Date => {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? new Date(0) : date;
};

export const useRecentGames = (homeTeam?: string, awayTeam?: string) => {
  return useQuery<{ homeRecentGames: RecentGameMatch[]; awayRecentGames: RecentGameMatch[] }>({
    queryKey: ['recentGames', homeTeam, awayTeam],
    queryFn: async () => {
      const csvText = await fetchCSVData();
      const allMatches = parseRecentGamesCSV(csvText);

      const homeRecentGames = homeTeam
        ? allMatches
            .filter((m) => m.Team_Home.toLowerCase() === homeTeam.toLowerCase())
            .sort((a, b) => safeDate(b.Date).getTime() - safeDate(a.Date).getTime())
            .slice(0, 6)
        : [];

      const awayRecentGames = awayTeam
        ? allMatches
            .filter((m) => m.Team_Away.toLowerCase() === awayTeam.toLowerCase())
            .sort((a, b) => safeDate(b.Date).getTime() - safeDate(a.Date).getTime())
            .slice(0, 6)
        : [];

      return { homeRecentGames, awayRecentGames };
    },
    staleTime: 10 * 60 * 1000,
    retry: 2,
    enabled: !!homeTeam || !!awayTeam,
  });
};
