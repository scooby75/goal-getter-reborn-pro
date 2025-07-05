
/**
 * Implementação do modelo Dixon-Coles para previsão de placares de futebol
 * Uma versão aprimorada do modelo de Poisson que considera fatores adicionais
 */

interface TeamRatings {
  attack: number;
  defense: number;
}

interface DixonColesParams {
  homeAdvantage: number;
  rho: number; // Parâmetro de correção para placares baixos
}

// Parâmetros padrão baseados em análises empíricas
const DEFAULT_PARAMS: DixonColesParams = {
  homeAdvantage: 0.3, // Vantagem de jogar em casa
  rho: -0.18 // Correção para placares baixos (0-0, 1-0, 0-1, 1-1)
};

/**
 * Calcula os ratings de ataque e defesa com base nas médias de gols
 */
const calculateTeamRatings = (
  homeAvg: number, 
  awayAvg: number, 
  leagueAvg: number = 2.5
): { home: TeamRatings; away: TeamRatings } => {
  // Normaliza as médias pela média da liga
  const homeAttack = homeAvg / leagueAvg;
  const homeDefense = leagueAvg / (homeAvg * 0.8 + leagueAvg * 0.2); // Assume defesa baseada em gols sofridos estimados
  
  const awayAttack = awayAvg / leagueAvg;
  const awayDefense = leagueAvg / (awayAvg * 0.8 + leagueAvg * 0.2);
  
  return {
    home: { attack: homeAttack, defense: homeDefense },
    away: { attack: awayAttack, defense: awayDefense }
  };
};

/**
 * Calcula a taxa lambda ajustada para o modelo Dixon-Coles
 */
const calculateLambda = (
  attackRating: number,
  defenseRating: number,
  homeAdvantage: number,
  isHome: boolean,
  leagueAvg: number = 2.5
): number => {
  const advantage = isHome ? homeAdvantage : 0;
  return (leagueAvg / 2) * attackRating * defenseRating * Math.exp(advantage);
};

/**
 * Função de correção tau para placares baixos (Dixon-Coles)
 */
const tauCorrection = (homeGoals: number, awayGoals: number, rho: number): number => {
  if (homeGoals === 0 && awayGoals === 0) return 1 - rho;
  if (homeGoals === 0 && awayGoals === 1) return 1 + rho;
  if (homeGoals === 1 && awayGoals === 0) return 1 + rho;
  if (homeGoals === 1 && awayGoals === 1) return 1 - rho;
  return 1;
};

/**
 * Calcula a probabilidade de Poisson ajustada
 */
const poissonProbability = (k: number, lambda: number): number => {
  if (lambda <= 0 || k < 0) return 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
};

/**
 * Factorial com memoização
 */
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

export interface DixonColesScore {
  score: string;
  probability: number;
  homeGoals: number;
  awayGoals: number;
}

/**
 * Implementa o modelo Dixon-Coles para calcular os placares mais prováveis
 */
export const getDixonColesScores = (
  homeAvg: number,
  awayAvg: number,
  maxGoals: number = 8,
  count: number = 8,
  params: DixonColesParams = DEFAULT_PARAMS
): DixonColesScore[] => {
  if (homeAvg <= 0 || awayAvg <= 0) {
    return [];
  }

  // Estima a média da liga baseada nas médias dos times
  const leagueAvg = (homeAvg + awayAvg) / 2 * 1.1; // Ajuste empírico
  
  // Calcula os ratings dos times
  const ratings = calculateTeamRatings(homeAvg, awayAvg, leagueAvg);
  
  // Calcula as taxas lambda para cada time
  const lambdaHome = calculateLambda(
    ratings.home.attack, 
    ratings.away.defense, 
    params.homeAdvantage, 
    true, 
    leagueAvg
  );
  
  const lambdaAway = calculateLambda(
    ratings.away.attack, 
    ratings.home.defense, 
    params.homeAdvantage, 
    false, 
    leagueAvg
  );

  console.log('Dixon-Coles parameters:', {
    homeAvg,
    awayAvg,
    leagueAvg,
    lambdaHome: lambdaHome.toFixed(3),
    lambdaAway: lambdaAway.toFixed(3),
    ratings
  });

  const scoreProbabilities: DixonColesScore[] = [];

  // Calcula probabilidades para todos os placares possíveis
  for (let homeGoals = 0; homeGoals <= maxGoals; homeGoals++) {
    for (let awayGoals = 0; awayGoals <= maxGoals; awayGoals++) {
      // Probabilidade base de Poisson
      const homeProb = poissonProbability(homeGoals, lambdaHome);
      const awayProb = poissonProbability(awayGoals, lambdaAway);
      
      // Aplica correção Dixon-Coles para placares baixos
      const tau = tauCorrection(homeGoals, awayGoals, params.rho);
      
      const probability = homeProb * awayProb * tau;
      
      scoreProbabilities.push({
        score: `${homeGoals} - ${awayGoals}`,
        probability,
        homeGoals,
        awayGoals
      });
    }
  }

  // Normaliza as probabilidades para que somem 1
  const totalProb = scoreProbabilities.reduce((sum, item) => sum + item.probability, 0);
  if (totalProb > 0) {
    scoreProbabilities.forEach(item => {
      item.probability = item.probability / totalProb;
    });
  }

  return scoreProbabilities
    .sort((a, b) => b.probability - a.probability)
    .slice(0, count);
};

/**
 * Calcula estatísticas agregadas do modelo Dixon-Coles
 */
export const getDixonColesStats = (
  homeAvg: number,
  awayAvg: number,
  params: DixonColesParams = DEFAULT_PARAMS
) => {
  const scores = getDixonColesScores(homeAvg, awayAvg, 10, 100, params);
  
  let homeWinProb = 0;
  let drawProb = 0;
  let awayWinProb = 0;
  let over15Prob = 0;
  let over25Prob = 0;
  let over35Prob = 0;
  let btsProb = 0;

  scores.forEach(score => {
    const { homeGoals, awayGoals, probability } = score;
    const totalGoals = homeGoals + awayGoals;

    if (homeGoals > awayGoals) homeWinProb += probability;
    else if (homeGoals === awayGoals) drawProb += probability;
    else awayWinProb += probability;

    if (totalGoals > 1.5) over15Prob += probability;
    if (totalGoals > 2.5) over25Prob += probability;
    if (totalGoals > 3.5) over35Prob += probability;
    if (homeGoals > 0 && awayGoals > 0) btsProb += probability;
  });

  return {
    homeWin: Math.round(homeWinProb * 100),
    draw: Math.round(drawProb * 100),
    awayWin: Math.round(awayWinProb * 100),
    over15: Math.round(over15Prob * 100),
    over25: Math.round(over25Prob * 100),
    over35: Math.round(over35Prob * 100),
    bts: Math.round(btsProb * 100)
  };
};
