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
        Status: row.Status || row['Match Status'] || '',
        League: row.League || row['League Name'] || 'Indefinida',
      };
    } catch (error) {
      console.warn(`❌ Erro ao processar linha ${index + 1}:`, error);
      return null;
    }
  }).filter(Boolean) as RecentGameMatch[];

  console.log(`✅ Processados ${matches.length} jogos`);
  return matches;
};

const parseDate = (dateString: string): number => {
  if (!dateString) return 0;
  
  // Tenta converter a data considerando diferentes formatos
  if (dateString.includes('/')) {
    const [day, month, year] = dateString.split('/');
    return new Date(`${year}-${month}-${day}`).getTime();
  } else if (dateString.includes('-')) {
    // Assume formato YYYY-MM-DD ou DD-MM-YYYY
    const parts = dateString.split('-');
    if (parts[0].length === 4) {
      return new Date(dateString).getTime();
    } else {
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
    }
  }
  return new Date(dateString).getTime();
};

export const useRecentGames = (homeTeam?: string, awayTeam?: string) => {
  return useQuery<RecentGameMatch[]>({
    queryKey: ['recentGames', homeTeam, awayTeam],
    queryFn: async () => {
      console.log('🔍 Buscando jogos recentes para:', { homeTeam, awayTeam });

      const csvText = await fetchCSVData();
      const allMatches = parseRecentGamesCSV(csvText);

      // Ordena todos os jogos por data (mais recente primeiro)
      const sortedMatches = [...allMatches].sort((a, b) => parseDate(b.Date) - parseDate(a.Date));

      console.log(`📊 Total de jogos carregados: ${sortedMatches.length}`);

      const filteredHomeGames: RecentGameMatch[] = homeTeam
        ? sortedMatches
            .filter(match => 
              match.Team_Home.toLowerCase().includes(homeTeam.toLowerCase())
            )
            .slice(0, 6)
        : [];

      const filteredAwayGames: RecentGameMatch[] = awayTeam
        ? sortedMatches
            .filter(match => 
              match.Team_Away.toLowerCase().includes(awayTeam.toLowerCase())
            )
            .slice(0, 6)
        : [];

      // Combina e remove duplicados mantendo a ordenação
      const uniqueMatches = [...filteredHomeGames, ...filteredAwayGames].reduce(
        (acc: RecentGameMatch[], current) => {
          const isDuplicate = acc.some(
            match =>
              match.Date === current.Date &&
              match.Team_Home === current.Team_Home &&
              match.Team_Away === current.Team_Away
          );
          return isDuplicate ? acc : [...acc, current];
        },
        []
      );

      console.log(`🎯 Total de jogos retornados: ${uniqueMatches.length}`);
      return uniqueMatches;
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    enabled: !!homeTeam || !!awayTeam,
  });
};
