
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Papa from 'papaparse';

interface MatchResult {
  league: string;
  team_home: string;
  team_away: string;
  score: string;
  ht_score: string;
  date: string;
}

interface ScoreFrequency {
  score: string;
  count: number;
  percentage: number;
}

const QUERY_CONFIG = {
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
  staleTime: 15 * 60 * 1000, // 15 minutes
  gcTime: 30 * 60 * 1000, // 30 minutes
} as const;

const fetchHistoricalData = async (): Promise<MatchResult[]> => {
  const csvFiles = [
    '/Data/all_leagues_results.csv',
    '/Data/all_leagues_results_2024.csv',
    '/Data/all_leagues_results_2023.csv'
  ];

  const allResults: MatchResult[] = [];

  for (const csvFile of csvFiles) {
    try {
      console.log(`Fetching historical data from: ${csvFile}`);
      const response = await fetch(csvFile, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        console.warn(`Failed to load ${csvFile}: ${response.status}`);
        continue;
      }

      const csvText = await response.text();
      const result = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transform: (value, field) => {
          return typeof value === 'string' ? value.trim() : value;
        }
      });

      if (result.data) {
        const processedData = result.data.map((row: any) => {
          const league = row.League || row.league || '';
          const teamHome = row.Team_Home || row.team_home || '';
          const teamAway = row.Team_Away || row.team_away || '';
          const score = row.Score || row.score || '';
          const htScore = row['HT Score'] || row.ht_score || '';
          const date = row.Date || row.date || '';

          return {
            league,
            team_home: teamHome,
            team_away: teamAway,
            score: score,
            ht_score: htScore,
            date: date
          };
        }).filter((match: MatchResult) => 
          match.league && 
          match.team_home && 
          match.team_away && 
          match.score &&
          match.score !== '' &&
          match.score.includes('-')
        );

        allResults.push(...processedData);
        console.log(`Loaded ${processedData.length} matches from ${csvFile}`);
      }
    } catch (error) {
      console.warn(`Error loading ${csvFile}:`, error);
    }
  }

  console.log(`Total historical matches loaded: ${allResults.length}`);
  return allResults;
};

const calculateScoreProbabilities = (
  matches: MatchResult[],
  homeTeam: string,
  awayTeam: string,
  league: string
): ScoreFrequency[] => {
  console.log(`Calculating probabilities for: ${homeTeam} vs ${awayTeam} in ${league}`);

  // Primeiro, filtrar apenas jogos da liga específica
  const leagueMatches = matches.filter(match => match.league === league);
  console.log(`Found ${leagueMatches.length} matches in ${league}`);

  if (leagueMatches.length === 0) {
    return [];
  }

  // Tentar encontrar jogos diretos entre os times (head-to-head)
  const headToHeadMatches = leagueMatches.filter(match => 
    (match.team_home === homeTeam && match.team_away === awayTeam) ||
    (match.team_home === awayTeam && match.team_away === homeTeam)
  );

  // Se há jogos diretos suficientes (pelo menos 5), usar apenas eles
  if (headToHeadMatches.length >= 5) {
    console.log(`Using ${headToHeadMatches.length} head-to-head matches`);
    return calculateScoreFrequencies(headToHeadMatches);
  }

  // Se não há jogos diretos suficientes, buscar jogos envolvendo cada time
  const teamMatches = leagueMatches.filter(match => 
    match.team_home === homeTeam || match.team_away === homeTeam ||
    match.team_home === awayTeam || match.team_away === awayTeam
  );

  // Se há jogos dos times suficientes (pelo menos 20), usar eles
  if (teamMatches.length >= 20) {
    console.log(`Using ${teamMatches.length} matches involving the teams`);
    return calculateScoreFrequencies(teamMatches);
  }

  // Caso contrário, usar todos os jogos da liga (amostra geral)
  console.log(`Using ${leagueMatches.length} general league matches`);
  return calculateScoreFrequencies(leagueMatches);
};

const calculateScoreFrequencies = (matches: MatchResult[]): ScoreFrequency[] => {
  const scoreCount: { [key: string]: number } = {};
  
  matches.forEach(match => {
    const score = match.score.trim();
    if (score && score.includes('-')) {
      scoreCount[score] = (scoreCount[score] || 0) + 1;
    }
  });

  const totalMatches = matches.length;
  const scoreFrequencies: ScoreFrequency[] = Object.entries(scoreCount)
    .map(([score, count]) => ({
      score,
      count,
      percentage: (count / totalMatches) * 100
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 8); // Top 8 mais prováveis

  console.log('Score frequencies calculated:', scoreFrequencies);
  return scoreFrequencies;
};

export const useHistoricalScores = (homeTeam?: string, awayTeam?: string, league?: string) => {
  const historicalDataQuery = useQuery<MatchResult[], Error>({
    queryKey: ['historicalScores'],
    queryFn: fetchHistoricalData,
    ...QUERY_CONFIG
  });

  const scoreProbabilities = React.useMemo(() => {
    if (!historicalDataQuery.data || !homeTeam || !awayTeam || !league) {
      return [];
    }

    return calculateScoreProbabilities(
      historicalDataQuery.data,
      homeTeam,
      awayTeam,
      league
    );
  }, [historicalDataQuery.data, homeTeam, awayTeam, league]);

  return {
    scoreProbabilities,
    isLoading: historicalDataQuery.isLoading,
    isError: historicalDataQuery.isError,
    error: historicalDataQuery.error,
    refetch: historicalDataQuery.refetch
  };
};
