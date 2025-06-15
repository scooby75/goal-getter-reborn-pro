
// Memoize factorial results for performance
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

/**
 * Calculates the Poisson probability.
 * @param k The number of occurrences.
 * @param lambda The average number of occurrences.
 * @returns The probability of k occurrences.
 */
const poissonProbability = (k: number, lambda: number): number => {
  if (lambda < 0 || k < 0 || !Number.isInteger(k)) {
    return 0;
  }
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
};

export interface ScoreProbability {
  score: string;
  probability: number;
}

/**
 * Calculates the most probable scores for a match given the average goals for each team.
 * @param lambdaHome Average goals for the home team.
 * @param lambdaAway Average goals for the away team.
 * @param maxGoals The maximum number of goals to consider for each team.
 * @param count The number of top scores to return.
 * @returns An array of the most probable scores.
 */
export const getProbableScores = (
  lambdaHome: number,
  lambdaAway: number,
  maxGoals: number = 10,
  count: number = 8
): ScoreProbability[] => {
    if (lambdaHome <= 0 || lambdaAway <= 0) {
        return [];
    }

  const homeGoalProbs: number[] = [];
  for (let i = 0; i <= maxGoals; i++) {
    homeGoalProbs.push(poissonProbability(i, lambdaHome));
  }

  const awayGoalProbs: number[] = [];
  for (let i = 0; i <= maxGoals; i++) {
    awayGoalProbs.push(poissonProbability(i, lambdaAway));
  }

  const scoreProbabilities: ScoreProbability[] = [];
  for (let homeGoals = 0; homeGoals <= maxGoals; homeGoals++) {
    for (let awayGoals = 0; awayGoals <= maxGoals; awayGoals++) {
      const probability = homeGoalProbs[homeGoals] * awayGoalProbs[awayGoals];
      scoreProbabilities.push({
        score: `${homeGoals} - ${awayGoals}`,
        probability,
      });
    }
  }

  return scoreProbabilities
    .sort((a, b) => b.probability - a.probability)
    .slice(0, count);
};
