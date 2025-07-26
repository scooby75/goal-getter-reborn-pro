// useRecentGames.ts
import { useQuery } from '@tanstack/react-query';
import Papa from 'papaparse';

export type RecentGameMatch = {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  result: string;
  score: string;
  htScore?: string;
  league: string;
  season?: string;
};

const CSV_URLS = [
  '/Data/all_leagues_results.csv',        // Dados mais recentes
  '/Data/all_leagues_results_2004.csv'    // Dados históricos
];

// 🔄 Função para buscar os CSVs
const fetchCSVData = async (): Promise<string[]> => {
  try {
    const fetchPromises = CSV_URLS.map(async (url) => {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/csv',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        console.warn(`Erro ao buscar ${url}, status: ${response.status}`);
        return '';
      }

      const csvText = await response.text();
      return csvText && csvText.trim().length > 100 ? csvText : '';
    });

    const results = await Promise.all(fetchPromises);
    const validResults = results.filter(text => text !== '');

    if (validResults.length === 0) {
      throw new Error('Todas as fontes CSV falharam');
    }

    return validResults;
  } catch (error) {
    console.error('Erro ao buscar dados CSV:', error);
    throw new Error('Erro ao carregar dados de jogos');
  }
};

// 🔄 Função para interpretar os CSVs em objetos de jogos
const parseCSV = (csvTexts: string[]): RecentGameMatch[] => {
  const allMatches: RecentGameMatch[] = [];

  csvTexts.forEach((csvText, index) => {
    try {
      const { data, errors } = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: header =>
          header.trim()
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, ''),
      });

      if (errors.length) {
        console.warn(`Erros ao parsear CSV ${index}:`, errors);
      }

      const matches = data.map((row: any) => {
        const rawScore = row.score || row.ft_score || '';
        const scoreParts = rawScore.split('-').map((v: string) => parseInt(v.trim(), 10));
        const [homeGoals = 0, awayGoals = 0] = scoreParts;

        return {
          date: row.date?.trim() || '',
          homeTeam: (row.home_team || row.team_home || '').trim(),
          awayTeam: (row.away_team || row.team_away || '').trim(),
          homeGoals: Number.isInteger(homeGoals) ? homeGoals : 0,
          awayGoals: Number.isInteger(awayGoals) ? awayGoals : 0,
          result: row.result || row.full_time_result || '',
          score: rawScore,
          htScore: row.ht_score || row.ht || '',
          league: row.league || 'Unknown',
          season: row.season || (index === 1 ? '2004' : undefined),
        };
      }).filter((match: RecentGameMatch) =>
        match.date && match.homeTeam && match.awayTeam
      );

      allMatches.push(...matches);
    } catch (error) {
      console.error(`Falha ao interpretar CSV ${index}:`, error);
    }
  });

  return allMatches;
};

// 🧠 Hook para uso nos componentes React
export const useRecentGames = (
  teamName?: string,
  limit = 6,
  includeHistorical = false
) => {
  return useQuery<RecentGameMatch[]>({
    queryKey: ['recentGames', teamName, limit, includeHistorical],
    queryFn: async () => {
      const csvTexts = await fetchCSVData();
      let allMatches = parseCSV(csvTexts);

      // 🔍 Se histórico não for incluído, removemos os antigos
      if (!includeHistorical) {
        allMatches = allMatches.filter(match => match.season !== '2004');
      }

      // 🧪 Se nenhum time for especificado, retorna jogos recentes
      if (!teamName) {
        return allMatches
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, limit);
      }

      // 🔠 Padroniza comparação do nome do time
      const teamNormalized = teamName.trim().toLowerCase();

      const filteredMatches = allMatches.filter(match =>
        match.homeTeam.trim().toLowerCase() === teamNormalized ||
        match.awayTeam.trim().toLowerCase() === teamNormalized
      );

      return filteredMatches
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
    },
    staleTime: 15 * 60 * 1000, // 15 minutos
    retry: 1,
    // ✅ sempre ativado se carregamento for necessário
    enabled: true,
  });
};
