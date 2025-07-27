import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Papa from 'papaparse';

export type HeadToHeadMatch = {
  League: string;
  Month?: string;
  Date: string;
  'Original Date'?: string;
  Team_Home: string;
  Score: string;
  Team_Away: string;
  'HT Score'?: string;
  'Over 2.5'?: string;
  'Total Goals'?: string;
  'Both Teams Scored'?: string;
  Status?: string;
};

const normalizeTeamName = (name: string) =>
  name?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';

const parseCSVFile = async (url: string): Promise<HeadToHeadMatch[]> => {
  const response = await fetch(url);
  const text = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse<HeadToHeadMatch>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validRows = results.data.filter(
          (row) =>
            row.Team_Home &&
            row.Team_Away &&
            row.Score &&
            /^\d+\s*-\s*\d+$/.test(row.Score)
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

    const allGames: HeadToHeadMatch[] = [];

    for (const url of urls) {
      try {
        const games = await parseCSVFile(url);
        allGames.push(...games);
        console.log(`✅ CSV carregado com sucesso de: ${url}`);
        console.log(`📊 Tamanho do CSV: ${games.length} partidas`);
      } catch (error: unknown) {
        console.error(`❌ Erro ao carregar CSV de ${url}`, error);
      }
    }

    console.log(`📦 Total de jogos combinados: ${allGames.length}`);
    return allGames;
  });
};

export const useHeadToHead = (team1: string, team2: string) => {
  const allMatchesQuery = useAllMatches();

  const filteredMatches = React.useMemo(() => {
    if (!allMatchesQuery.data) return [];

    const t1 = normalizeTeamName(team1);
    const t2 = normalizeTeamName(team2);

    return allMatchesQuery.data.filter(
      (g) =>
        (normalizeTeamName(g.Team_Home ?? '') === t1 &&
         normalizeTeamName(g.Team_Away ?? '') === t2) ||
        (normalizeTeamName(g.Team_Home ?? '') === t2 &&
         normalizeTeamName(g.Team_Away ?? '') === t1)
    );
  }, [allMatchesQuery.data, team1, team2]);

  return {
    data: filteredMatches,
    isLoading: allMatchesQuery.isLoading,
    isError: allMatchesQuery.isError,
    error: allMatchesQuery.error,
  } as const;
};
