import { useQuery } from '@tanstack/react-query';
import Papa from 'papaparse';

export type HeadToHeadMatch = {
  Date: string;
  Team_Home: string;
  Team_Away: string;
  Goals_Home: number;
  Goals_Away: number;
  Result: string;
  Score?: string;
  HT_Score?: string;
  League?: string;
};

const fetchCSVData = async (): Promise<string> => {
  const urls = [
    '/Data/all_leagues_results.csv',
    '/Data/all_leagues_results_2024.csv',
  ];

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

  throw new Error('Não foi possível carregar os dados dos confrontos');
};

const normalizeTeamName = (name: string): string => {
  return name.toLowerCase().trim();
};

const parseHeadToHeadCSV = (csvText: string): HeadToHeadMatch[] => {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (!result?.data) {
    return [];
  }

  const rows = Array.isArray(result.data) ? result.data : [];

  return rows
    .map((row) => {
      try {
        let homeGoals = 0;
        let awayGoals = 0;
        const scoreRaw = row.Score || '';

        if (scoreRaw.includes('-')) {
          const [homeStr, awayStr] = scoreRaw.split('-').map(v => parseInt(v.trim()) || 0);
          homeGoals = homeStr;
          awayGoals = awayStr;
        }

        let resultStr = '';
        if (homeGoals > awayGoals) resultStr = 'H';
        else if (homeGoals < awayGoals) resultStr = 'A';
        else resultStr = 'D';

        return {
          Date: row.Date || row.Data || '',
          Team_Home: row.HomeTeam || row.Team_Home || '',
          Team_Away: row.AwayTeam || row.Team_Away || '',
          Goals_Home: homeGoals,
          Goals_Away: awayGoals,
          Result: resultStr,
          Score: scoreRaw.trim(),
          HT_Score: row.HT_Score || row['HT Score'] || '',
          League: row.League || 'Indefinida',
        };
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean) as HeadToHeadMatch[];
};

export const useHeadToHead = (team1?: string, team2?: string) => {
  return useQuery<HeadToHeadMatch[]>({
    queryKey: ['headToHead', team1, team2],
    queryFn: async () => {
      const csvText = await fetchCSVData();
      const allMatches = parseHeadToHeadCSV(csvText);

      if (team1 && team2) {
        const team1Norm = normalizeTeamName(team1);
        const team2Norm = normalizeTeamName(team2);

        const filtered = allMatches
          .filter(match => {
            const homeNorm = normalizeTeamName(match.Team_Home);
            const awayNorm = normalizeTeamName(match.Team_Away);
            return homeNorm === team1Norm && awayNorm === team2Norm;
          })
          .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());

        return filtered.slice(0, 6);
      }

      if (team1 || team2) {
        const teamNorm = normalizeTeamName(team1 || team2 || '');

        const filtered = allMatches
          .filter(match => {
            const homeNorm = normalizeTeamName(match.Team_Home);
            const awayNorm = normalizeTeamName(match.Team_Away);
            return homeNorm === teamNorm || awayNorm === teamNorm;
          })
          .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());

        return filtered.slice(0, 6);
      }

      return allMatches.slice(0, 6);
    },
    staleTime: 10 * 60 * 1000,
    retry: 2,
    enabled: (typeof team1 === 'string' && team1.trim() !== '') || 
             (typeof team2 === 'string' && team2.trim() !== ''),
  });
};
