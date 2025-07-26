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
  const url = '/Data/all_leagues_results.csv';
  console.log('📡 Buscando dados de:', url);

  try {
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

    if (csvText.length < 100) {
      throw new Error('CSV retornado está vazio ou muito pequeno');
    }

    console.log(`✅ CSV carregado: ${csvText.length} caracteres`);
    return csvText;
  } catch (error) {
    console.error('❌ Erro ao carregar CSV:', error);
    throw error;
  }
};

const parseRecentGamesCSV = (csvText: string): RecentGameMatch[] => {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors.length) {
    console.warn('⚠️ Erros ao parsear CSV:', result.errors);
  }

  const rows = result.data as any[];

  const matches: RecentGameMatch[] = rows.map((row) => {
    const scoreRaw = row.Score || row['Score'] || '';
    let homeGoals = 0;
    let awayGoals = 0;

    if (scoreRaw.includes('-')) {
      const [homeStr, awayStr] = scoreRaw.split('-').map(v => v.trim());
      homeGoals = parseInt(homeStr) || 0;
      awayGoals = parseInt(awayStr) || 0;
    }

    return {
      Date: row.Date || row.Data || '',
      Team_Home: row.HomeTeam || row.Team_Home || '',
      Team_Away: row.AwayTeam || row.Team_Away || '',
      Goals_Home: homeGoals,
      Goals_Away: awayGoals,
      Result: row.FullTimeResult || row.Result || row.Resultado || '',
      Score: scoreRaw,
      HT_Score: row.HT_Score || row.HTScore || row['HT Score'] || '',
      League: row.League || 'Indefinida',
    };
  }).filter(m => m.Date && m.Team_Home && m.Team_Away);

  console.log(`✅ ${matches.length} jogos processados`);
  return matches;
};

export const useRecentGames = (homeTeam?: string, awayTeam?: string) => {
  return useQuery<RecentGameMatch[]>({
    queryKey: ['recentGames', homeTeam, awayTeam],
    queryFn: async () => {
      const csvText = await fetchCSVData();
      const allMatches = parseRecentGamesCSV(csvText);

      let filtered: RecentGameMatch[] = [];

      if (homeTeam) {
        const name = homeTeam.toLowerCase().trim();
        const homeMatches = allMatches.filter(match =>
          match.Team_Home.toLowerCase() === name ||
          match.Team_Home.toLowerCase().includes(name)
        );
        filtered.push(...homeMatches);
        console.log(`🏠 ${homeTeam} em casa: ${homeMatches.length} jogos`);
      }

      if (awayTeam) {
        const name = awayTeam.toLowerCase().trim();
        const awayMatches = allMatches.filter(match =>
          match.Team_Away.toLowerCase() === name ||
          match.Team_Away.toLowerCase().includes(name)
        );
        filtered.push(...awayMatches);
        console.log(`🚌 ${awayTeam} fora: ${awayMatches.length} jogos`);
      }

      // Evita duplicatas de partidas
      const uniqueMatches = filtered.filter((match, i, arr) =>
        arr.findIndex(m =>
          m.Date === match.Date &&
          m.Team_Home === match.Team_Home &&
          m.Team_Away === match.Team_Away
        ) === i
      );

      return uniqueMatches
        .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
        .slice(0, 6);
    },
    staleTime: 10 * 60 * 1000,
    retry: 2,
    enabled: !!homeTeam || !!awayTeam,
  });
};
