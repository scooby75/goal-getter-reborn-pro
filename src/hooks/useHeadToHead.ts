import { useQuery } from '@tanstack/react-query';
import Papa from 'papaparse';

export type GameMatch = {
  League: string;
  Date: string;
  'Home Team': string;
  'Away Team': string;
  Score: string;
};

const normalizeTeamName = (name: string) =>
  name?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';

const parseCSVFile = async (url: string): Promise<GameMatch[]> => {
  const response = await fetch(url);
  const text = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse<GameMatch>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validRows = results.data.filter(
          (row) => row['Home Team'] && row['Away Team'] && row.Score
        );
        resolve(validRows);
      },
      error: (err) => reject(err),
    });
  });
};

export const useAllMatches = () => {
  return useQuery(['allMatches'], async () => {
    const urls = [
      '/Data/all_leagues_results.csv',
      '/Data/all_leagues_results_2024.csv',
    ];

    const allGames: GameMatch[] = [];

    for (const url of urls) {
      try {
        const games = await parseCSVFile(url);
        allGames.push(...games);
        console.log(`✅ CSV carregado com sucesso de: ${url}`);
        console.log(`📊 Tamanho do CSV: ${games.length} partidas`);
      } catch (error) {
        console.error(`❌ Erro ao carregar CSV de ${url}`, error);
      }
    }

    console.log(`📦 Total de jogos combinados: ${allGames.length}`);
    return allGames;
  });
};

export const filterH2HMatches = (
  allGames: GameMatch[],
  team1: string,
  team2: string
): GameMatch[] => {
  const t1 = normalizeTeamName(team1);
  const t2 = normalizeTeamName(team2);

  const h2h = allGames.filter(
    (g) =>
      normalizeTeamName(g['Home Team']) === t1 &&
      normalizeTeamName(g['Away Team']) === t2
  );

  console.log(`🎯 Confrontos diretos encontrados (${t1} x ${t2}): ${h2h.length}`);
  return h2h;
};
