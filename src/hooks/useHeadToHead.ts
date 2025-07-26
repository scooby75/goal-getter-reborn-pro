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

// Função para buscar CSV com múltiplas tentativas
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

// Função para parsear o CSV
const parseHeadToHeadCSV = (csvText: string): HeadToHeadMatch[] => {
  console.log('=== PARSE CSV ===');

  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors.length) {
    console.error('Erros ao parsear CSV:', result.errors);
    return [];
  }

  const rows = result.data as any[];

  const matches: HeadToHeadMatch[] = rows.map((row, index) => {
    try {
      let homeGoals = 0;
      let awayGoals = 0;

      if (row.Score) {
        const scoreParts = row.Score.split('-').map((s: string) => s.trim());
        if (scoreParts.length === 2) {
          homeGoals = parseInt(scoreParts[0], 10);
          awayGoals = parseInt(scoreParts[1], 10);
        }
      }

      let result = '';
      if (!isNaN(homeGoals) && !isNaN(awayGoals)) {
        if (homeGoals > awayGoals) result = 'H';
        else if (homeGoals < awayGoals) result = 'A';
        else result = 'D';
      }

      return {
        Date: row.Date || row.Data || '',
        Team_Home: row.HomeTeam || row.Team_Home || '',
        Team_Away: row.AwayTeam || row.Team_Away || '',
        Goals_Home: isNaN(homeGoals) ? 0 : homeGoals,
        Goals_Away: isNaN(awayGoals) ? 0 : awayGoals,
        Result: result,
        Score: row.Score || '',
        HT_Score: row.HT_Score || row['HT Score'] || row.HTScore || '',
        League: row.League || 'Indefinida',
      };
    } catch (error) {
      console.warn(`❌ Erro ao processar linha ${index + 1}:`, error);
      return null;
    }
  }).filter(Boolean) as HeadToHeadMatch[];

  console.log(`✅ Processados ${matches.length} confrontos`);
  return matches;
};

// Hook principal
export const useHeadToHead = (team1?: string, team2?: string) => {
  return useQuery<HeadToHeadMatch[]>({
    queryKey: ['headToHead', team1, team2],
    queryFn: async () => {
      console.log('🔍 Buscando confrontos para:', { team1, team2 });

      const csvText = await fetchCSVData();
      const allMatches = parseHeadToHeadCSV(csvText);

      console.log(`📊 Total de confrontos carregados: ${allMatches.length}`);

      if (team1 && team2) {
        const t1 = team1.toLowerCase();
        const t2 = team2.toLowerCase();

        const filtered = allMatches.filter(match => {
          const h = match.Team_Home.toLowerCase();
          const a = match.Team_Away.toLowerCase();

          // Apenas confrontos com team1 como mandante
          return (
            (h === t1 && a === t2) ||
            (h.includes(t1) && a.includes(t2))
          );
        });

        console.log(`🎯 Confrontos diretos (team1 em casa): ${filtered.length}`);
        return filtered
          .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
          .slice(0, 10);
      }

      if (team1 || team2) {
        const selectedTeam = (team1 || team2 || '').toLowerCase();
        const filtered = allMatches.filter(match =>
          match.Team_Home.toLowerCase().includes(selectedTeam) ||
          match.Team_Away.toLowerCase().includes(selectedTeam)
        );

        console.log(`🎯 Jogos do time encontrados: ${filtered.length}`);
        return filtered
          .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
          .slice(0, 10);
      }

      return allMatches.slice(0, 50); // fallback padrão
    },
    staleTime: 10 * 60 * 1000,
    retry: 2,
    enabled: !!team1 || !!team2,
  });
};
