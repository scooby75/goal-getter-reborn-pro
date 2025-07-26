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
  const response = await fetch('/Data/all_leagues_results.csv');
  if (!response.ok) throw new Error('Falha ao carregar dados');
  return await response.text();
};

const normalizeTeamName = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .trim();
};

const parseRecentGamesCSV = (csvText: string): RecentGameMatch[] => {
  const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  
  return (result.data as any[]).map((row) => {
    try {
      const scoreParts = (row.Score || '0-0').split('-').map(v => parseInt(v.trim()) || 0);
      return {
        Date: row.Date || '',
        Team_Home: row.Team_Home || row.HomeTeam || '',
        Team_Away: row.Team_Away || row.AwayTeam || '',
        Goals_Home: scoreParts[0],
        Goals_Away: scoreParts[1],
        Result: row.Result || (scoreParts[0] > scoreParts[1] ? 'H' : scoreParts[0] < scoreParts[1] ? 'A' : 'D'),
        Score: row.Score || '',
        HT_Score: row.HT_Score || '',
        League: row.League || 'Indefinida'
      };
    } catch (error) {
      return null;
    }
  }).filter(Boolean) as RecentGameMatch[];
};

export const useRecentGames = (homeTeam?: string, awayTeam?: string) => {
  return useQuery<RecentGameMatch[]>({
    queryKey: ['recentGames', homeTeam, awayTeam],
    queryFn: async () => {
      const csvText = await fetchCSVData();
      const allMatches = parseRecentGamesCSV(csvText);

      let filteredMatches: RecentGameMatch[] = [];

      if (homeTeam) {
        const homeNorm = normalizeTeamName(homeTeam);
        filteredMatches.push(...allMatches.filter(m => 
          normalizeTeamName(m.Team_Home).includes(homeNorm)
        ));
      }

      if (awayTeam) {
        const awayNorm = normalizeTeamName(awayTeam);
        filteredMatches.push(...allMatches.filter(m => 
          normalizeTeamName(m.Team_Away).includes(awayNorm)
        ));
      }

      // Remove duplicates and sort by date (newest first)
      const uniqueMatches = [...new Map(
        filteredMatches.map(m => 
          [m.Date + m.Team_Home + m.Team_Away, m]
        ).values()
      ].sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());

      return uniqueMatches.slice(0, 8); // Retorna até 8 jogos mais recentes
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!homeTeam || !!awayTeam
  });
};
