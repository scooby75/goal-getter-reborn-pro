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
          console.log(`📊 Tamanho do CSV: ${csvText.length} caracteres`);
          return csvText;
        }
      }

      console.warn(`❌ Falha na URL: ${url} - Status: ${response.status}`);
    } catch (error) {
      console.warn(`❌ Erro na URL: ${url}`, error);
    }
  }

  throw new Error('Não foi possível carregar os dados dos confrontos de nenhuma fonte disponível');
};

const normalizeTeamName = (name: string): string => {
  return name.toLowerCase().trim();
};

const parseHeadToHeadCSV = (csvText: string): HeadToHeadMatch[] => {
  console.log('=== PARSE CSV ===');

  if (!csvText || typeof csvText !== 'string') {
    console.error('csvText inválido:', csvText);
    return [];
  }

  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (!result || typeof result !== 'object' || !('data' in result)) {
    console.error('Resultado de parse inválido:', result);
    return [];
  }

  if (result.errors && result.errors.length) {
    console.error('Erros ao parsear CSV:', result.errors);
  }

  const rows = Array.isArray(result.data) ? result.data : [];
  console.log(`Linhas lidas no CSV: ${rows.length}`);

  const matches: HeadToHeadMatch[] = rows
    .map((row, index) => {
      try {
        let homeGoals = 0;
        let awayGoals = 0;
        const scoreRaw = row.Score || '';

        if (typeof scoreRaw === 'string' && scoreRaw.includes('-')) {
          const scoreParts = scoreRaw.split('-').map((s: string) => s.trim());
          if (scoreParts.length === 2) {
            homeGoals = parseInt(scoreParts[0], 10) || 0;
            awayGoals = parseInt(scoreParts[1], 10) || 0;
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
          Score: scoreRaw.trim(),
          HT_Score: row.HT_Score || row['HT Score'] || row.HTScore || '',
          League: row.League || 'Indefinida',
        };
      } catch (error) {
        console.warn(`❌ Erro ao processar linha ${index + 1}:`, error);
        return null;
      }
    })
    .filter(Boolean) as HeadToHeadMatch[];

  console.log(`✅ Processados ${matches.length} confrontos`);
  return matches;
};

const safeDateCompare = (a: HeadToHeadMatch, b: HeadToHeadMatch): number => {
  const dateA = new Date(a.Date).getTime() || 0;
  const dateB = new Date(b.Date).getTime() || 0;
  return dateB - dateA;
};

export const useHeadToHead = (team1?: string, team2?: string) => {
  return useQuery<HeadToHeadMatch[]>({
    queryKey: ['headToHead', team1, team2],
    queryFn: async () => {
      console.log('🔍 Buscando confrontos para:', { team1, team2 });

      const csvText = await fetchCSVData();
      const allMatches = parseHeadToHeadCSV(csvText);

      console.log(`📊 Total de confrontos carregados: ${allMatches.length}`);

      if (team1 && team2) {
        const team1Norm = normalizeTeamName(team1);
        const team2Norm = normalizeTeamName(team2);

        const filtered = allMatches.filter(match => {
          const homeNorm = normalizeTeamName(match.Team_Home);
          const awayNorm = normalizeTeamName(match.Team_Away);
          return homeNorm === team1Norm && awayNorm === team2Norm;
        });

        console.log(`🎯 Confrontos diretos (${team1} x ${team2}): ${filtered.length}`);

        return filtered
          .sort(safeDateCompare)
          .slice(0, 6);
      }

      if (team1 || team2) {
        const teamNorm = normalizeTeamName(team1 || team2 || '');

        const filtered = allMatches.filter(match => {
          const homeNorm = normalizeTeamName(match.Team_Home);
          const awayNorm = normalizeTeamName(match.Team_Away);
          return homeNorm === teamNorm || awayNorm === teamNorm;
        });

        console.log(`🎯 Jogos do time encontrados: ${filtered.length}`);

        return filtered
          .sort(safeDateCompare)
          .slice(0, 10);
      }

      console.log('🔄 Nenhum time especificado, retornando os primeiros 50 confrontos');
      return allMatches.slice(0, 50);
    },
    staleTime: 10 * 60 * 1000,
    retry: 2,
    enabled: (typeof team1 === 'string' && team1.trim() !== '') || 
             (typeof team2 === 'string' && team2.trim() !== ''),
  });
};
