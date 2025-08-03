
import { useQuery } from '@tanstack/react-query';
import Papa from 'papaparse';
import { TeamStats } from '@/types/goalStats';

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
  source: 'H2H' | 'Home' | 'Away' | 'League';
  weight: number;
}

interface PredictionResult {
  score: string;
  totalWeight: number;
  sources: string[];
  finalProbability: number;
}

const fetchMatchData = async (): Promise<MatchResult[]> => {
  const csvFiles = [
    '/Data/all_leagues_results.csv',
    '/Data/all_leagues_results_2024.csv',
    '/Data/all_leagues_results_2023.csv'
  ];

  const allResults: MatchResult[] = [];

  for (const csvFile of csvFiles) {
    try {
      console.log(`Carregando dados de: ${csvFile}`);
      const response = await fetch(csvFile, {
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!response.ok) {
        console.warn(`Falha ao carregar ${csvFile}: ${response.status}`);
        continue;
      }

      const csvText = await response.text();
      const result = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transform: (value) => typeof value === 'string' ? value.trim() : value
      });

      if (result.data) {
        const processedData = result.data.map((row: any) => ({
          league: row.League || row.league || '',
          team_home: row.Team_Home || row.team_home || '',
          team_away: row.Team_Away || row.team_away || '',
          score: row.Score || row.score || '',
          ht_score: row['HT Score'] || row.ht_score || '',
          date: row.Date || row.date || ''
        })).filter((match: MatchResult) => 
          match.league && 
          match.team_home && 
          match.team_away && 
          match.score &&
          match.score.includes('-')
        );

        allResults.push(...processedData);
      }
    } catch (error) {
      console.warn(`Erro ao carregar ${csvFile}:`, error);
    }
  }

  console.log(`Total de jogos carregados: ${allResults.length}`);
  return allResults;
};

const calculateScoreFrequencies = (
  matches: MatchResult[],
  source: 'H2H' | 'Home' | 'Away' | 'League',
  weight: number
): ScoreFrequency[] => {
  const scoreCount: { [key: string]: number } = {};
  
  matches.forEach(match => {
    const score = match.score.trim();
    if (score && score.includes('-')) {
      scoreCount[score] = (scoreCount[score] || 0) + 1;
    }
  });

  const totalMatches = matches.length;
  return Object.entries(scoreCount).map(([score, count]) => ({
    score,
    count,
    percentage: (count / totalMatches) * 100,
    source,
    weight
  }));
};

const combineAndRankScores = (allFrequencies: ScoreFrequency[]): PredictionResult[] => {
  const scoreMap: { [key: string]: PredictionResult } = {};

  allFrequencies.forEach(freq => {
    if (!scoreMap[freq.score]) {
      scoreMap[freq.score] = {
        score: freq.score,
        totalWeight: 0,
        sources: [],
        finalProbability: 0
      };
    }

    const weightedScore = (freq.percentage / 100) * freq.weight;
    scoreMap[freq.score].totalWeight += weightedScore;
    scoreMap[freq.score].sources.push(`${freq.source} (${freq.percentage.toFixed(1)}%)`);
  });

  const results = Object.values(scoreMap);
  const maxWeight = Math.max(...results.map(r => r.totalWeight));

  return results
    .map(result => ({
      ...result,
      finalProbability: (result.totalWeight / maxWeight) * 100
    }))
    .sort((a, b) => b.finalProbability - a.finalProbability)
    .slice(0, 6);
};

export const useAdvancedScorePrediction = (
  homeStats?: TeamStats,
  awayStats?: TeamStats
) => {
  const homeTeam = homeStats?.Team;
  const awayTeam = awayStats?.Team;
  const league = homeStats?.League_Name || awayStats?.League_Name;

  return useQuery<PredictionResult[], Error>({
    queryKey: ['advancedScorePrediction', homeTeam, awayTeam, league],
    queryFn: async () => {
      if (!homeTeam || !awayTeam || !league) {
        throw new Error('Times e liga são obrigatórios');
      }

      console.log(`Calculando previsão avançada: ${homeTeam} vs ${awayTeam} (${league})`);
      
      const allMatches = await fetchMatchData();
      const leagueMatches = allMatches.filter(match => match.league === league);

      console.log(`Jogos na liga ${league}: ${leagueMatches.length}`);

      // 1. Head-to-Head (peso 40%)
      const h2hMatches = leagueMatches.filter(match => 
        (match.team_home === homeTeam && match.team_away === awayTeam) ||
        (match.team_home === awayTeam && match.team_away === homeTeam)
      );
      const h2hFreqs = calculateScoreFrequencies(h2hMatches, 'H2H', 0.4);
      console.log(`H2H matches: ${h2hMatches.length}`);

      // 2. Jogos do time da casa (peso 25%)
      const homeMatches = leagueMatches.filter(match => 
        match.team_home === homeTeam || match.team_away === homeTeam
      ).slice(-20); // Últimos 20 jogos
      const homeFreqs = calculateScoreFrequencies(homeMatches, 'Home', 0.25);
      console.log(`Home team matches: ${homeMatches.length}`);

      // 3. Jogos do time visitante (peso 25%)
      const awayMatches = leagueMatches.filter(match => 
        match.team_home === awayTeam || match.team_away === awayTeam
      ).slice(-20); // Últimos 20 jogos
      const awayFreqs = calculateScoreFrequencies(awayMatches, 'Away', 0.25);
      console.log(`Away team matches: ${awayMatches.length}`);

      // 4. Todos os jogos da liga (peso 10%)
      const leagueFreqs = calculateScoreFrequencies(
        leagueMatches.slice(-100), // Últimos 100 jogos da liga
        'League', 
        0.1
      );
      console.log(`League matches sample: ${Math.min(100, leagueMatches.length)}`);

      // Combinar todas as frequências
      const allFrequencies = [...h2hFreqs, ...homeFreqs, ...awayFreqs, ...leagueFreqs];
      const finalPredictions = combineAndRankScores(allFrequencies);

      console.log('Top 6 previsões:', finalPredictions);
      return finalPredictions;
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    enabled: !!homeTeam && !!awayTeam && !!league
  });
};
