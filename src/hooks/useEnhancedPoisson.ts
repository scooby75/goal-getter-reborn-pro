
import { useQuery } from '@tanstack/react-query';
import { useRecentGames, RecentGameMatch } from './useRecentGames';
import { useHeadToHead, HeadToHeadMatch } from './useHeadToHead';

export interface EnhancedPoissonScore {
  score: string;
  probability: number;
  homeGoals: number;
  awayGoals: number;
}

// Função para calcular média de gols baseada nos jogos
const calculateGoalsAverage = (matches: RecentGameMatch[], teamName: string, isHome: boolean): number => {
  if (!matches || matches.length === 0) return 1.0;

  const relevantMatches = matches.filter(match => {
    if (isHome) {
      return match.Team_Home.toLowerCase().includes(teamName.toLowerCase());
    } else {
      return match.Team_Away.toLowerCase().includes(teamName.toLowerCase());
    }
  }).slice(0, 6); // Últimos 6 jogos

  if (relevantMatches.length === 0) return 1.0;

  const totalGoals = relevantMatches.reduce((sum, match) => {
    if (isHome) {
      return sum + (match.Goals_Home || 0);
    } else {
      return sum + (match.Goals_Away || 0);
    }
  }, 0);

  return totalGoals / relevantMatches.length;
};

// Função para calcular média de gols nos confrontos diretos
const calculateH2HAverage = (h2hMatches: HeadToHeadMatch[], teamName: string): number => {
  if (!h2hMatches || h2hMatches.length === 0) return 1.0;

  const validMatches = h2hMatches.filter(match => match.Score && match.Score.includes('-'));
  if (validMatches.length === 0) return 1.0;

  const totalGoals = validMatches.reduce((sum, match) => {
    const [homeScore, awayScore] = match.Score.split('-').map(s => parseInt(s.trim()) || 0);
    
    if (match.Team_Home.toLowerCase().includes(teamName.toLowerCase())) {
      return sum + homeScore;
    } else {
      return sum + awayScore;
    }
  }, 0);

  return totalGoals / validMatches.length;
};

// Função factorial com cache
const factorialCache: { [key: number]: number } = {};
const factorial = (n: number): number => {
  if (n < 0) return NaN;
  if (n === 0) return 1;
  if (factorialCache[n]) return factorialCache[n];
  
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  factorialCache[n] = result;
  return result;
};

// Distribuição de Poisson
const poissonProbability = (k: number, lambda: number): number => {
  if (lambda <= 0 || k < 0) return 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
};

export const useEnhancedPoisson = (homeTeam?: string, awayTeam?: string) => {
  const { data: recentGames, isLoading: recentLoading } = useRecentGames(homeTeam, awayTeam);
  const { data: h2hMatches, isLoading: h2hLoading } = useHeadToHead(homeTeam, awayTeam);

  return useQuery<EnhancedPoissonScore[]>({
    queryKey: ['enhancedPoisson', homeTeam, awayTeam],
    queryFn: () => {
      if (!homeTeam || !awayTeam) {
        throw new Error('Times não especificados');
      }

      console.log('=== ENHANCED POISSON CALCULATION ===');
      console.log('Home Team:', homeTeam);
      console.log('Away Team:', awayTeam);

      // Calcular médias baseadas nos últimos 6 jogos
      const homeAvgRecent = calculateGoalsAverage(recentGames || [], homeTeam, true);
      const awayAvgRecent = calculateGoalsAverage(recentGames || [], awayTeam, false);
      
      // Calcular médias baseadas no H2H
      const homeAvgH2H = calculateH2HAverage(h2hMatches || [], homeTeam);
      const awayAvgH2H = calculateH2HAverage(h2hMatches || [], awayTeam);

      console.log('Recent Averages:', { homeAvgRecent, awayAvgRecent });
      console.log('H2H Averages:', { homeAvgH2H, awayAvgH2H });

      // Pesos para combinar as médias
      const recentWeight = 0.6;
      const h2hWeight = 0.4;

      // Se não há dados H2H suficientes, usar apenas dados recentes
      const hasH2HData = (h2hMatches?.length || 0) >= 3;
      
      const homeLambda = hasH2HData 
        ? (homeAvgRecent * recentWeight + homeAvgH2H * h2hWeight)
        : homeAvgRecent * 1.1; // Pequeno ajuste para vantagem de casa

      const awayLambda = hasH2HData 
        ? (awayAvgRecent * recentWeight + awayAvgH2H * h2hWeight)
        : awayAvgRecent * 0.9; // Pequeno ajuste para desvantagem de visitante

      console.log('Final Lambda values:', { homeLambda, awayLambda });
      console.log('H2H Data available:', hasH2HData, 'matches:', h2hMatches?.length || 0);

      const scoreProbabilities: EnhancedPoissonScore[] = [];

      // Calcular probabilidades para placares de 0 a 6 gols para cada time
      for (let homeGoals = 0; homeGoals <= 6; homeGoals++) {
        for (let awayGoals = 0; awayGoals <= 6; awayGoals++) {
          const homeProb = poissonProbability(homeGoals, homeLambda);
          const awayProb = poissonProbability(awayGoals, awayLambda);
          const probability = homeProb * awayProb;

          scoreProbabilities.push({
            score: `${homeGoals} - ${awayGoals}`,
            probability,
            homeGoals,
            awayGoals
          });
        }
      }

      // Normalizar probabilidades
      const totalProb = scoreProbabilities.reduce((sum, item) => sum + item.probability, 0);
      if (totalProb > 0) {
        scoreProbabilities.forEach(item => {
          item.probability = item.probability / totalProb;
        });
      }

      // Retornar os 6 placares mais prováveis
      const topScores = scoreProbabilities
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 6);

      console.log('Top 6 scores:', topScores);
      return topScores;
    },
    enabled: !!homeTeam && !!awayTeam && !recentLoading && !h2hLoading,
    staleTime: 5 * 60 * 1000,
    retry: 2
  });
};
