
import { useQuery } from '@tanstack/react-query';

export type HeadToHeadMatch = {
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

// Função para buscar CSV com múltiplas tentativas
const fetchCSVData = async (): Promise<string> => {
  console.log('=== FETCH CSV DATA ===');
  
  // URLs alternativas para tentar
  const urls = [
    '/Data/all_leagues_results.csv',
  ];

  for (const url of urls) {
    try {
      console.log(`🔄 Tentando URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/csv,text/plain,*/*',
          'Cache-Control': 'no-cache'
        },
        mode: url.startsWith('http') ? 'cors' : 'same-origin'
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
  
  if (!csvText || csvText.trim() === '') {
    console.warn('CSV vazio ou inválido');
    return [];
  }

  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    console.warn('CSV não possui linhas suficientes');
    return [];
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  console.log('📝 Headers encontrados:', headers);

  // Mapear índices dos headers importantes
  const dateIndex = headers.findIndex(h => h.toLowerCase().includes('date') || h.toLowerCase().includes('data'));
  const homeIndex = headers.findIndex(h => h.toLowerCase().includes('home') || h.toLowerCase().includes('casa'));
  const awayIndex = headers.findIndex(h => h.toLowerCase().includes('away') || h.toLowerCase().includes('visitante'));
  const homeGoalsIndex = headers.findIndex(h => h.toLowerCase().includes('gols_home') || h.toLowerCase().includes('home_goals'));
  const awayGoalsIndex = headers.findIndex(h => h.toLowerCase().includes('gols_away') || h.toLowerCase().includes('away_goals'));
  const resultIndex = headers.findIndex(h => h.toLowerCase().includes('resultado') || h.toLowerCase().includes('result'));
  
  console.log('📍 Índices:', { dateIndex, homeIndex, awayIndex, homeGoalsIndex, awayGoalsIndex, resultIndex });

  const matches: HeadToHeadMatch[] = [];

  for (let i = 1; i < Math.min(lines.length, 1000); i++) { // Limitar a 1000 linhas para evitar travamento
    const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
    
    if (cols.length < headers.length / 2) continue; // Pular linhas mal formadas

    try {
      const match: HeadToHeadMatch = {
        Date: dateIndex >= 0 ? cols[dateIndex] || '' : '',
        Team_Home: homeIndex >= 0 ? cols[homeIndex] || '' : '',
        Team_Away: awayIndex >= 0 ? cols[awayIndex] || '' : '',
        Goals_Home: homeGoalsIndex >= 0 ? parseInt(cols[homeGoalsIndex] || '0') || 0 : 0,
        Goals_Away: awayGoalsIndex >= 0 ? parseInt(cols[awayGoalsIndex] || '0') || 0 : 0,
        Result: resultIndex >= 0 ? cols[resultIndex] || '' : '',
        Score: homeGoalsIndex >= 0 && awayGoalsIndex >= 0 
          ? `${cols[homeGoalsIndex]?.trim() || '0'}-${cols[awayGoalsIndex]?.trim() || '0'}` 
          : '0-0',
        HT_Score: headers.findIndex(h => h.toLowerCase().includes('ht score')) >= 0 
          ? cols[headers.findIndex(h => h.toLowerCase().includes('ht score'))]?.trim() || '' 
          : '',
        League: cols[headers.findIndex(h => h.toLowerCase().includes('league'))] || 'Unknown'
      };

      if (match.Team_Home && match.Team_Away) {
        matches.push(match);
      }
    } catch (error) {
      console.warn(`Erro ao processar linha ${i}:`, error);
    }
  }

  console.log(`✅ Processados ${matches.length} confrontos`);
  return matches;
};

export const useHeadToHead = (team1?: string, team2?: string) => {
  return useQuery<HeadToHeadMatch[]>({
    queryKey: ['headToHead', team1, team2],
    queryFn: async () => {
      console.log('🔍 Buscando confrontos para:', { team1, team2 });
      
      const csvText = await fetchCSVData();
      const allMatches = parseHeadToHeadCSV(csvText);

      console.log(`📊 Total de confrontos carregados: ${allMatches.length}`);

      // Se ambos os times forem fornecidos, filtrar confrontos diretos
      if (team1 && team2) {
        const t1 = team1.toLowerCase();
        const t2 = team2.toLowerCase();

        const filtered = allMatches.filter(match => {
          const h = match.Team_Home.toLowerCase();
          const a = match.Team_Away.toLowerCase();

          const isDirectMatch = 
            (h === t1 && a === t2) ||
            (h === t2 && a === t1) ||
            (h.includes(t1) && a.includes(t2)) ||
            (h.includes(t2) && a.includes(t1));

          return isDirectMatch;
        });

        console.log(`🎯 Confrontos diretos encontrados: ${filtered.length}`);
        return filtered
          .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
          .slice(0, 10);
      }

      // Se apenas um time for fornecido, retornar últimos jogos dele
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

      return allMatches.slice(0, 50); // Retornar apenas primeiros 50 se nenhum filtro
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    enabled: true, // Sempre habilitado para tentar carregar os dados
  });
};
