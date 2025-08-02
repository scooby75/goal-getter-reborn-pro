
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Papa from 'papaparse';

interface MatchResult {
  league: string;
  team_home: string;
  team_away: string;
  score_home: number;
  score_away: number;
  full_time_score: string;
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
          const league = row.league || row.League || '';
          const teamHome = row.team_home || row.Team_Home || row.home_team || '';
          const teamAway = row.team_away || row.Team_Away || row.away_team || '';
          const scoreHome = parseInt(row.score_home || row.Score_Home || row.home_score || '0', 10) || 0;
          const scoreAway = parseInt(row.score_away || row.Score_Away || row.away_score || '0', 10) || 0;
          const fullTimeScore = `${scoreHome} - ${scoreAway}`;

          return {
            league,
            team_home: teamHome,
            team_away: teamAway,
            score_home: scoreHome,
            score_away: scoreAway,
            full_time_score: fullTimeScore
          };
        }).filter((match: MatchResult) => 
          match.league && 
          match.team_home && 
          match.team_away && 
          !isNaN(match.score_home) && 
          !isNaN(match.score_away)
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

  // Filtrar jogos relevantes - jogos dos times específicos na mesma liga
  const relevantMatches = matches.filter(match => 
    match.league === league && (
      (match.team_home === homeTeam || match.team_away === homeTeam) ||
      (match.team_home === awayTeam || match.team_away === awayTeam)
    )
  );

  console.log(`Found ${relevantMatches.length} relevant historical matches`);

  if (relevantMatches.length === 0) {
    // Se não há jogos específicos, usar jogos da liga
    const leagueMatches = matches.filter(match => match.league === league);
    console.log(`Using ${leagueMatches.length} league matches for general patterns`);
    return calculateGeneralScoreFrequencies(leagueMatches);
  }

  // Contar frequência dos placares
  const scoreCount: { [key: string]: number } = {};
  
  relevantMatches.forEach(match => {
    const score = match.full_time_score;
    scoreCount[score] = (scoreCount[score] || 0) + 1;
  });

  // Converter para array e calcular percentuais
  const totalMatches = relevantMatches.length;
  const scoreFrequencies: ScoreFrequency[] = Object.entries(scoreCount)
    .map(([score, count]) => ({
      score,
      count,
      percentage: (count / totalMatches) * 100
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 8); // Top 8 mais prováveis

  return scoreFrequencies;
};

const calculateGeneralScoreFrequencies = (matches: MatchResult[]): ScoreFrequency[] => {
  const scoreCount: { [key: string]: number } = {};
  
  matches.forEach(match => {
    const score = match.full_time_score;
    scoreCount[score] = (scoreCount[score] || 0) + 1;
  });

  const totalMatches = matches.length;
  return Object.entries(scoreCount)
    .map(([score, count]) => ({
      score,
      count,
      percentage: (count / totalMatches) * 100
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 8);
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
