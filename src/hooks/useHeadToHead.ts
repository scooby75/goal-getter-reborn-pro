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

// Função para normalizar strings (sem acento, espaço ou hífen)
const normalize = (str: string): string =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-\s]/g, '')
    .trim();

// Função para transformar CSV em array de jogos
const parseHeadToHeadCSV = (csvText: string): HeadToHeadMatch[] => {
  if (!csvText || typeof csvText !== 'string') return [];

  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (!result || typeof result !== 'object' || !('data' in result)) return [];

  const rows = Array.isArray(result.data) ? result.data : [];

  const matches: HeadToHeadMatch[] = rows
    .map((row, index) => {
      try {
        const scoreRaw = (row.Score || row.score || '').trim().replace(/\s+/g, '');
        const htScoreRaw = (row.HT_Score || row['HT Score'] || row.HTScore || '').trim().replace(/\s+/g, '');

        let homeGoals = 0;
        let awayGoals = 0;

        if (scoreRaw.includes('-')) {
          const parts = scoreRaw.split('-');
          if (parts.length === 2) {
            const h = parseInt(parts[0], 10);
            const a = parseInt(parts[1], 10);
            homeGoals = isNaN(h) ? 0 : h;
            awayGoals = isNaN(a) ? 0 : a;
          }
        }

        let resultStr = '';
        if (!isNaN(homeGoals) && !isNaN(awayGoals)) {
          if (homeGoals > awayGoals) resultStr = 'H';
          else if (homeGoals < awayGoals) resultStr = 'A';
          else resultStr = 'D';
        }

        return {
          Date: row.Date || row.Data || '',
          Team_Home: row.HomeTeam || row.Team_Home || '',
          Team_Away: row.AwayTeam || row.Team_Away || '',
          Goals_Home: homeGoals,
          Goals_Away: awayGoals,
          Result: resultStr,
          Score: scoreRaw || '',
          HT_Score: htScoreRaw || '',
          League: row.League || 'Indefinida',
        };
      } catch (error) {
        console.warn(`❌ Erro ao processar linha ${index + 1}:`, error);
        return null;
      }
    })
    .filter(Boolean) as HeadToHeadMatch[];

  return matches;
};

// Garante datas válidas para ordenação
const safeDate = (d: string): Date => {
  const date = new Date(d);
  return isNaN(date.getTime()) ? new Date(0) : date;
};

// Busca e junta os dois arquivos CSV
const fetchAndParseAllCSVData = async (): Promise<HeadToHeadMatch[]> => {
  const urls = [
    '/Data/all_leagues_results.csv',
    '/Data/all_leagues_results_2024.csv',
  ];

  let allMatches: HeadToHeadMatch[] = [];

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
          const parsedMatches = parseHeadToHeadCSV(csvText);
          allMatches = allMatches.concat(parsedMatches);
        }
      }
    } catch (error) {
      console.warn(`Erro ao carregar CSV de ${url}`, error);
    }
  }

  return allMatches;
};

// Hook principal
export const useHeadToHead = (team1?: string, team2?: string) => {
  return useQuery<HeadToHeadMatch[]>({
    queryKey: ['headToHead', team1, team2],
    queryFn: async () => {
      const allMatches = await fetchAndParseAllCSVData();

      const t1Norm = team1 ? normalize(team1) : '';
      const t2Norm = team2 ? normalize(team2) : '';

      if (team1 && team2) {
        const filtered = allMatches.filter(match => {
          const h = normalize(match.Team_Home);
          const a = normalize(match.Team_Away);
          return (
            (h === t1Norm && a === t2Norm) || // team1 mandante
            (h === t2Norm && a === t1Norm)    // team2 mandante
          );
        });

        return filtered
          .sort((a, b) => safeDate(b.Date).getTime() - safeDate(a.Date).getTime())
          .slice(0, 6);
      }

      if (team1 || team2) {
        const selectedTeam = normalize(team1 || team2 || '');
        const filtered = allMatches.filter(match => {
          const h = normalize(match.Team_Home);
          const a = normalize(match.Team_Away);
          return h === selectedTeam || a === selectedTeam;
        });

        return filtered
          .sort((a, b) => safeDate(b.Date).getTime() - safeDate(a.Date).getTime())
          .slice(0, 10);
      }

      return allMatches.slice(0, 50);
    },
    staleTime: 10 * 60 * 1000,
    retry: 2,
    enabled:
      (typeof team1 === 'string' && team1.trim() !== '') ||
      (typeof team2 === 'string' && team2.trim() !== ''),
  });
};
