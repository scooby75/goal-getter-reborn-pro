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

// Função para buscar CSV com múltiplas tentativas, com logs
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
        } else {
          console.warn(`⚠️ CSV vazio ou muito pequeno da URL: ${url}`);
        }
      } else {
        console.warn(`❌ Falha na URL: ${url} - Status: ${response.status}`);
      }
    } catch (error) {
      console.warn(`❌ Erro na URL: ${url}`, error);
    }
  }

  throw new Error('Não foi possível carregar os dados dos confrontos de nenhuma fonte disponível');
};

// Normaliza string para evitar erros e facilitar comparações
const normalize = (str: string): string =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

// Função para parsear o CSV com validações e tratamento defensivo
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
    // Continua mesmo com erros se houver dados
  }

  // Garante que rows seja sempre um array
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
            homeGoals = parseInt(scoreParts[0], 10);
            awayGoals = parseInt(scoreParts[1], 10);
          }
        }

        // Calcula resultado padrão H / A / D
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
          Score: (scoreRaw || '').trim(),
          HT_Score: row.HT_Score || row['HT Score'] || row.HTScore || '',
          League: row.League || 'Indefinida',
        };
      } catch (error) {
        console.warn(`❌ Erro ao processar linha ${index + 1}:`, error);
        return null;
      }
    })
    .filter(Boolean); // Remove nulos

  console.log(`✅ Processados ${matches.length} confrontos`);
  return matches;
};

// Função para garantir datas válidas na ordenação
const safeDate = (d: string): Date => {
  const date = new Date(d);
  return isNaN(date.getTime()) ? new Date(0) : date;
};

// Hook principal com validações reforçadas, logs para debug e proteção contra erros de tipo
export const useHeadToHead = (team1?: string, team2?: string) => {
  return useQuery<HeadToHeadMatch[]>({
    queryKey: ['headToHead', team1, team2],
    queryFn: async () => {
      console.log('🔍 Buscando confrontos para:', { team1, team2 });

      const csvText = await fetchCSVData();

      if (!csvText || typeof csvText !== 'string') {
        console.error('csvText inválido no queryFn:', csvText);
        return [];
      }

      const allMatchesRaw = parseHeadToHeadCSV(csvText);
      if (!Array.isArray(allMatchesRaw)) {
        console.error('parseHeadToHeadCSV retornou não-array:', allMatchesRaw);
        return [];
      }

      const allMatches: HeadToHeadMatch[] = allMatchesRaw;

      console.log(`📊 Total de confrontos carregados: ${allMatches.length}`);

      const t1Norm = team1 ? normalize(team1) : '';
      const t2Norm = team2 ? normalize(team2) : '';

      // Debug dos inputs normalizados
      console.log('Time 1 normalizado:', t1Norm);
      console.log('Time 2 normalizado:', t2Norm);

      if (team1 && team2) {
        const filtered = allMatches.filter(match => {
          const h = normalize(match.Team_Home);
          const a = normalize(match.Team_Away);

          return (h === t1Norm && a === t2Norm) || (h.includes(t1Norm) && a.includes(t2Norm));
        });

        console.log(`🎯 Confrontos diretos (team1 em casa): ${filtered.length}`);

        return filtered
          .sort((a, b) => safeDate(b.Date).getTime() - safeDate(a.Date).getTime())
          .slice(0, 6);
      }

      if (team1 || team2) {
        const selectedTeam = normalize(team1 || team2 || '');

        const filtered = allMatches.filter(match => {
          const h = normalize(match.Team_Home);
          const a = normalize(match.Team_Away);
          return h.includes(selectedTeam) || a.includes(selectedTeam);
        });

        console.log(`🎯 Jogos do time encontrados: ${filtered.length}`);

        return filtered
          .sort((a, b) => safeDate(b.Date).getTime() - safeDate(a.Date).getTime())
          .slice(0, 10);
      }

      console.log('🔄 Nenhum time especificado, retornando os primeiros 50 confrontos');
      return allMatches.slice(0, 50);
    },
    staleTime: 10 * 60 * 1000,
    retry: 2,
    enabled:
      (typeof team1 === 'string' && team1.trim() !== '') ||
      (typeof team2 === 'string' && team2.trim() !== ''),
  });
};
