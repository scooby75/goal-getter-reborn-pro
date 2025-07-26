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
          return csvText;
        }
      } else {
        console.warn(`❌ Falha na URL: ${url} - Status: ${response.status}`);
      }
    } catch (error) {
      console.warn(`❌ Erro na URL: ${url}`, error);
    }
  }

  throw new Error('Não foi possível carregar os dados dos confrontos.');
};

const normalize = (str: string): string =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const parseHeadToHeadCSV = (csvText: string): HeadToHeadMatch[] => {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (!result || typeof result !== 'object' || !('data' in result)) {
    console.error('Resultado de parse inválido:', result);
    return [];
  }

  const rows = Array.isArray(result.data) ? result.data : [];

  const matches: HeadToHeadMatch[] = rows
    .map((row: Record<string, string>, index) => {
      try {
        let homeGoals = 0;
        let awayGoals = 0;
        const scoreRaw = row.Score || '';

        if (scoreRaw.includes('-')) {
          const [homeStr, awayStr] = scoreRaw.split('-').map(s => s.trim());
          homeGoals = parseInt(homeStr, 10);
          awayGoals = parseInt(awayStr, 10);
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
          Goals_Home: isNaN(homeGoals) ? 0 : homeGoals,
          Goals_Away: isNaN(awayGoals) ? 0 : awayGoals,
          Result: resultStr,
          Score: scoreRaw.trim(),
          HT_Score: row.HT_Score || row['HT Score'] || row.HTScore || '',
          League: row.League || 'Indefinida',
        };
      } catch (error) {
        console.warn(`❌ Erro ao processar linha ${index + 1}:`, error);
        return null;
      }
    })
    .filter(Boolean);

  return matches;
};

const safeDate = (d: string): Date => {
  const date = new Date(d);
  return isNaN(date.getTime()) ? new Date(0) : date;
};

export const useHeadToHead = (team1?: string, team2?: string) => {
  return useQuery<HeadToHeadMatch[]>({
    queryKey: ['headToHead', team1, team2],
    queryFn: async () => {
      console.log('🔍 Buscando confrontos para:', { team1, team2 });

      const csvText = await fetchCSVData();
      const allMatches = parseHeadToHeadCSV(csvText);

      console.log(`📊 Total de confrontos carregados: ${allMatches.length}`);

      const t1Norm = team1 ? normalize(team1) : '';
      const t2Norm = team2 ? normalize(team2) : '';

      if (team1 && team2) {
        const filtered = allMatches.filter(match => {
          const h = normalize(match.Team_Home);
          const a = normalize(match.Team_Away);
          return h === t1Norm && a === t2Norm;
        });

        console.log(`🎯 Confrontos diretos com ${team1} em casa vs ${team2} fora: ${filtered.length}`);

        return filtered
          .sort((a, b) => safeDate(b.Date).getTime() - safeDate(a.Date).getTime())
          .slice(0, 6);
      }

      return [];
    },
    staleTime: 10 * 60 * 1000,
    retry: 2,
    enabled: !!team1 && !!team2,
  });
};
