
import { useQuery } from '@tanstack/react-query';
import { useMarkovChain } from './useMarkovChain';
import { TeamStats } from '@/types/goalStats';

interface MarkovPoissonPrediction {
  homeWin: number;
  draw: number;
  awayWin: number;
  mostProbableScores: Array<{
    score: string;
    probability: number;
    homeGoals: number;
    awayGoals: number;
  }>;
  confidence: number;
  markovInfluence: number;
}

const poissonProbability = (lambda: number, k: number): number => {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
};

const factorial = (n: number): number => {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
};

const calculateBasePoissonScores = (
  homeAvgGoals: number,
  awayAvgGoals: number
): Array<{ score: string; probability: number; homeGoals: number; awayGoals: number }> => {
  const scores: Array<{ score: string; probability: number; homeGoals: number; awayGoals: number }> = [];
  
  // Calcular probabilidades para scores de 0-0 até 5-5
  for (let homeGoals = 0; homeGoals <= 5; homeGoals++) {
    for (let awayGoals = 0; awayGoals <= 5; awayGoals++) {
      const homeProb = poissonProbability(homeAvgGoals, homeGoals);
      const awayProb = poissonProbability(awayAvgGoals, awayGoals);
      const probability = homeProb * awayProb * 100;
      
      scores.push({
        score: `${homeGoals} - ${awayGoals}`,
        probability,
        homeGoals,
        awayGoals
      });
    }
  }
  
  return scores.sort((a, b) => b.probability - a.probability);
};

export const useMarkovPoisson = (homeStats?: TeamStats, awayStats?: TeamStats) => {
  const { data: markovData } = useMarkovChain(homeStats?.Team, awayStats?.Team);
  
  return useQuery<MarkovPoissonPrediction>({
    queryKey: ['markovPoisson', homeStats?.Team, awayStats?.Team],
    queryFn: () => {
      if (!homeStats || !awayStats || !markovData) {
        throw new Error('Dados insuficientes para análise Markov-Poisson');
      }

      console.log('=== ANÁLISE MARKOV-POISSON ===');
      console.log('Time Casa:', homeStats.Team);
      console.log('Time Visitante:', awayStats.Team);

      // Médias de gols baseadas nas estatísticas dos times
      const homeAvgGoals = (homeStats.Goals_Scored_Home || 0) / Math.max(homeStats.Matches_Played_Home || 1, 1);
      const awayAvgGoals = (awayStats.Goals_Scored_Away || 0) / Math.max(awayStats.Matches_Played_Away || 1, 1);

      console.log('Média gols casa (base):', homeAvgGoals);
      console.log('Média gols fora (base):', awayAvgGoals);

      // Calcular scores base usando Poisson
      const baseScores = calculateBasePoissonScores(homeAvgGoals, awayAvgGoals);

      // Aplicar influência das Cadeias de Markov
      const markovInfluence = markovData.confidence / 100;
      
      // Ajustar probabilidades baseado nas previsões de Markov
      const adjustedScores = baseScores.map(score => {
        let adjustment = 1.0;
        
        // Se casa deve ganhar segundo Markov, aumentar probabilidade de scores com vitória da casa
        if (markovData.homeWin > markovData.awayWin && score.homeGoals > score.awayGoals) {
          adjustment += (markovData.homeWin / 100) * markovInfluence * 0.5;
        }
        // Se visitante deve ganhar, aumentar probabilidade de scores com vitória visitante
        else if (markovData.awayWin > markovData.homeWin && score.awayGoals > score.homeGoals) {
          adjustment += (markovData.awayWin / 100) * markovInfluence * 0.5;
        }
        // Se deve empatar, aumentar probabilidade de empates
        else if (markovData.draw > Math.max(markovData.homeWin, markovData.awayWin) && score.homeGoals === score.awayGoals) {
          adjustment += (markovData.draw / 100) * markovInfluence * 0.3;
        }
        
        return {
          ...score,
          probability: score.probability * adjustment
        };
      });

      // Normalizar probabilidades
      const totalProb = adjustedScores.reduce((sum, score) => sum + score.probability, 0);
      const normalizedScores = adjustedScores.map(score => ({
        ...score,
        probability: (score.probability / totalProb) * 100
      })).sort((a, b) => b.probability - a.probability).slice(0, 8);

      // Calcular probabilidades finais de resultado
      let homeWin = 0, draw = 0, awayWin = 0;
      
      normalizedScores.forEach(score => {
        if (score.homeGoals > score.awayGoals) {
          homeWin += score.probability;
        } else if (score.homeGoals === score.awayGoals) {
          draw += score.probability;
        } else {
          awayWin += score.probability;
        }
      });

      // Combinar com previsões de Markov para resultado final
      const finalHomeWin = (homeWin + markovData.homeWin * markovInfluence) / (1 + markovInfluence);
      const finalDraw = (draw + markovData.draw * markovInfluence) / (1 + markovInfluence);
      const finalAwayWin = (awayWin + markovData.awayWin * markovInfluence) / (1 + markovInfluence);

      const confidence = Math.min((markovData.confidence + 70) / 2, 95);

      console.log('Scores mais prováveis (Markov-Poisson):', normalizedScores.slice(0, 6));
      console.log('Probabilidades finais:', { finalHomeWin, finalDraw, finalAwayWin });

      return {
        homeWin: finalHomeWin,
        draw: finalDraw,
        awayWin: finalAwayWin,
        mostProbableScores: normalizedScores,
        confidence,
        markovInfluence: markovInfluence * 100
      };
    },
    enabled: !!homeStats && !!awayStats && !!markovData,
    staleTime: 10 * 60 * 1000,
    retry: 2
  });
};
