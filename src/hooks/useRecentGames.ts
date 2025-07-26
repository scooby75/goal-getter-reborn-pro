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
};

const CSV_URL = '/Data/all_leagues_results.csv';

const fetchCSVData = async (): Promise<string> => {
  try {
    const response = await fetch(CSV_URL, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csvText = await response.text();
    
    if (!csvText || csvText.trim().length < 100) {
      throw new Error('CSV content too short or empty');
    }

    return csvText;
  } catch (error) {
    console.error('Failed to fetch CSV data:', error);
    throw new Error('Failed to load recent games data');
  }
};

const parseCSV = (csvText: string): RecentGameMatch[] => {
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
      console.warn('CSV parsing warnings:', errors);
    }

    return data.map((row: any) => {
      // Extrai placares (trata vários formatos)
      const score = row.score || row.ft_score || '';
      const [homeGoals = 0, awayGoals = 0] = score.split('-')
        .map((v: string) => parseInt(v.trim()) || [0, 0];

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
      };
    }).filter((match: RecentGameMatch) => 
      match.date && match.homeTeam && match.awayTeam
    );
  } catch (error) {
    console.error('CSV parsing failed:', error);
    return [];
  }
};

export const useRecentGames = (teamName?: string, limit = 6) => {
  return useQuery<RecentGameMatch[]>({
    queryKey: ['recentGames', teamName],
    queryFn: async () => {
      const csvText = await fetchCSVData();
      const allMatches = parseCSV(csvText);

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
    staleTime: 15 * 60 * 1000, // 15 minutos
    retry: 1,
    enabled: !!teamName,
  });
};
