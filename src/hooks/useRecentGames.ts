// useRecentGames.ts
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

  const urls = [
    '/Data/all_leagues_results_2024.csv',  
    '/Data/all_leagues_results.csv'
  ];

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
        if (csvText && csvText.trim().length > 100) {
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
  console.log('=== PARSE RECENT GAMES CSV ===');

  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors.length) {
    console.error('Erros ao parsear CSV:', result.errors);
    return [];
  }

  const rows = result.data as any[];

  const matches: RecentGameMatch[] = rows.map((row, index) => {
    try {
      const scoreRaw = row.Score || row['Score'] || '';
      let homeGoals = 0;
      let awayGoals = 0;

      if (scoreRaw.includes('-')) {
        const [homeStr, awayStr] = scoreRaw.split('-').map(v => v.trim());
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

  console.log(`✅ Processados ${matches.length} jogos`);
  return matches;
};

export const useRecentGames = (homeTeam?: string, awayTeam?: string) => {
  return useQuery<RecentGameMatch[]>({
    queryKey: ['recentGames', homeTeam, awayTeam],
    queryFn: async () => {
      console.log('🔍 Buscando jogos recentes para:', { homeTeam, awayTeam });

      const csvText = await fetchCSVData();
      const allMatches = parseRecentGamesCSV(csvText);

      console.log(`📊 Total de jogos carregados: ${allMatches.length}`);

      const filteredHomeGames: RecentGameMatch[] = homeTeam
        ? allMatches
            .filter(
              (match) =>
                match.Team_Home.toLowerCase() === homeTeam.toLowerCase()
            )
            .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
            .slice(0, 6)
        : [];

      const filteredAwayGames: RecentGameMatch[] = awayTeam
        ? allMatches
            .filter(
              (match) =>
                match.Team_Away.toLowerCase() === awayTeam.toLowerCase()
            )
            .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
            .slice(0, 6)
        : [];

      const uniqueMatches = [...filteredHomeGames, ...filteredAwayGames].filter(
        (match, index, self) =>
          index ===
          self.findIndex(
            (m) =>
              m.Date === match.Date &&
              m.Team_Home === match.Team_Home &&
              m.Team_Away === match.Team_Away
          )
      );

      console.log(`🎯 Total de jogos retornados (6 casa + 6 fora): ${uniqueMatches.length}`);

      return uniqueMatches;
    },
    staleTime: 10 * 60 * 1000,
    retry: 2,
    enabled: !!homeTeam || !!awayTeam,
  });
};
