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
  '/Data/all_leagues_results.csv',       // Dados mais recentes
  '/Data/all_leagues_results_2004.csv'  // Dados históricos
];

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
        console.warn(`Failed to fetch ${url}, status: ${response.status}`);
        return '';
      }

      const csvText = await response.text();
      return csvText && csvText.trim().length > 100 ? csvText : '';
    });

    const results = await Promise.all(fetchPromises);
    const validResults = results.filter(text => text !== '');

    if (validResults.length === 0) {
      throw new Error('All CSV sources failed');
    }

    return validResults;
  } catch (error) {
    console.error('Failed to fetch CSV data:', error);
    throw new Error('Failed to load games data');
  }
};

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
        console.warn(`CSV parsing warnings for source ${index}:`, errors);
      }

      const matches = data.map((row: any) => {
        const score = row.score || row.ft_score || '';
        const scoreParts = score.split('-').map((v: string) => parseInt(v.trim(), 10) || [0, 0];
        const [homeGoals = 0, awayGoals = 0] = scoreParts;

        return {
          date: row.date || '',
          homeTeam: row.home_team || row.team_home || '',
          awayTeam: row.away_team || row.team_away || '',
          homeGoals: Number.isInteger(homeGoals) ? homeGoals : 0,
          awayGoals: Number.isInteger(awayGoals) ? awayGoals : 0,
          result: row.result || row.full_time_result || '',
          score,
          htScore: row.ht_score || row.ht || '',
          league: row.league || 'Unknown',
          season: row.season || (index === 1 ? '2004' : undefined),
        };
      }).filter((match: RecentGameMatch) => 
        match.date && match.homeTeam && match.awayTeam
      );

      allMatches.push(...matches);
    } catch (error) {
      console.error(`Failed to parse CSV source ${index}:`, error);
    }
  });

  return allMatches;
};

export const useRecentGames = (teamName?: string, limit = 6, includeHistorical = false) => {
  return useQuery<RecentGameMatch[]>({
    queryKey: ['recentGames', teamName, limit, includeHistorical],
    queryFn: async () => {
      const csvTexts = await fetchCSVData();
      let allMatches = parseCSV(csvTexts);

      if (!includeHistorical) {
        // Filtra apenas dados recentes se não incluir históricos
        allMatches = allMatches.filter(match => !match.season || match.season !== '2004');
      }

      if (!teamName) {
        return allMatches
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, limit);
      }

      const teamLower = teamName.toLowerCase();
      const filteredMatches = allMatches.filter(match =>
        match.homeTeam.toLowerCase().includes(teamLower) ||
        match.awayTeam.toLowerCase().includes(teamLower)
      );

      return filteredMatches
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 1,
    enabled: !!teamName,
  });
};
