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

// Normaliza string removendo acentos, espaços e hífens para comparação mais segura
const normalize = (str: string): string =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-\s]/g, '')  // remove hífen e espaços
    .trim();

// Parse CSV para o formato HeadToHeadMatch
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

        const scoreRaw = row.Score || '' || row.score || '';

        if (typeof scoreRaw === 'string' && scoreRaw.includes('-')) {
          const scoreParts = scoreRaw.split('-').map((s: string) => s.trim());
          if (scoreParts.length === 2) {
            homeGoals = parseInt(scoreParts[0], 10);
            awayGoals = parseInt(scoreParts[1], 10);
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
    .filter(Boolean) as HeadToHeadMatch[];

  console.log(`✅ Processados ${matches.length} confrontos`);
  return matches;
};

// Função para garantir datas válidas na ordenação
const safeDate = (d: string): Date => {
  const date = new Date(d);
  return isNaN(date.getTime()) ? new Date(0) : date;
};

// Função para buscar e juntar os dois CSVs
const fetchAndParseAllCSVData = async (): Promise<HeadToHeadMatch[]> => {
  console.log('=== FETCH E PARSE DOS CSVs ===');

  const urls = [
    '/Data/all_leagues_results.csv',
    '/Data/all_leagues_results_2024.csv',
  ];

  let allMatches: HeadToHeadMatch[] = [];

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
          console.log(`✅ CSV carregado com sucesso de: ${url} (tamanho: ${csvText.length})`);

          const parsedMatches = parseHeadToHeadCSV(csvText);
          allMatches = allMatches.concat(parsedMatches);
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

  console.log(`📊 Total de confrontos juntados: ${allMatches.length}`);

  return allMatches;
};

// Hook principal para buscar e filtrar confrontos
export const useHeadToHead = (team1?: string, team2?: string) => {
  return useQuery<HeadToHeadMatch[]>({
    queryKey: ['headToHead', team1, team2],
    queryFn: async () => {
      console.log('🔍 Buscando confrontos para:', { team1, team2 });

      const allMatches = await fetchAndParseAllCSVData();

      const t1Norm = team1 ? normalize(team1) : '';
      const t2Norm = team2 ? normalize(team2) : '';

      console.log('Time 1 normalizado:', t1Norm);
      console.log('Time 2 normalizado:', t2Norm);

      if (team1 && team2) {
        const filtered = allMatches.filter(match => {
          const h = normalize(match.Team_Home);
          const a = normalize(match.Team_Away);
          return (
            (h === t1Norm && a === t2Norm) || // time1 mandante, time2 visitante
            (h === t2Norm && a === t1Norm)    // time2 mandante, time1 visitante
          );
        });

        console.log(`🎯 Confrontos diretos (ambos os lados): ${filtered.length}`);

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
