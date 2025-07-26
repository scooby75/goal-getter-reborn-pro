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
  console.log('=== FETCH CSV DATA ===');

  const urls = [
    '/Data/all_leagues_results.csv',
    '/Data/all_leagues_results_2024.csv',
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'text/csv,text/plain,*/*',
          'Cache-Control': 'no-cache',
        },
        mode: url.startsWith('http') ? 'cors' : 'same-origin',
      });

      if (response.ok) {
        const csvText = await response.text();
        if (csvText.trim().length > 100) {
          return csvText;
        }
      }

      console.warn(`❌ Falha na URL: ${url} - Status: ${response.status}`);
    } catch (err) {
      console.warn(`❌ Erro na URL: ${url}`, err);
    }
  }

  throw new Error('Não foi possível carregar os dados dos confrontos');
};

const normalize = (str: string): string =>
  str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

const parseHeadToHeadCSV = (csvText: string): HeadToHeadMatch[] => {
  const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });

  return result.data.map((row: any, i) => {
    try {
      const scoreRaw = row.Score || row['Score'] || '';
      let [homeGoals, awayGoals] = [0, 0];

      if (typeof scoreRaw === 'string' && scoreRaw.includes('-')) {
        const [h, a] = scoreRaw.split('-').map((v) => parseInt(v.trim()));
        homeGoals = isNaN(h) ? 0 : h;
        awayGoals = isNaN(a) ? 0 : a;
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
        HT_Score: row.HT_Score || row.HTScore || row['HT Score'] || '',
        League: row.League || 'Indefinida',
      };
    } catch (err) {
      console.warn(`Erro ao processar linha ${i + 1}:`, err);
      return null;
    }
  }).filter(Boolean) as HeadToHeadMatch[];
};

const safeDate = (d: string): Date => {
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? new Date(0) : parsed;
};

export const useHeadToHead = (team1?: string, team2?: string) => {
  return useQuery<HeadToHeadMatch[]>({
    queryKey: ['headToHead', team1, team2],
    queryFn: async () => {
      const csvText = await fetchCSVData();
      const matches = parseHeadToHeadCSV(csvText);

      const t1 = normalize(team1 || '');
      const t2 = normalize(team2 || '');

      if (team1 && team2) {
        const filtered = matches.filter(
          (m) => normalize(m.Team_Home) === t1 && normalize(m.Team_Away) === t2
        );
        return filtered.sort((a, b) => safeDate(b.Date).getTime() - safeDate(a.Date).getTime()).slice(0, 6);
      }

      if (team1 || team2) {
        const selected = t1 || t2;
        const filtered = matches.filter(
          (m) => normalize(m.Team_Home).includes(selected) || normalize(m.Team_Away).includes(selected)
        );
        return filtered.sort((a, b) => safeDate(b.Date).getTime() - safeDate(a.Date).getTime()).slice(0, 10);
      }

      return matches.slice(0, 50);
    },
    staleTime: 10 * 60 * 1000,
    retry: 2,
    enabled: !!team1 || !!team2,
  });
};
