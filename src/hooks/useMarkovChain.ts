
import { useQuery } from '@tanstack/react-query';
import { useRecentGames, RecentGameMatch } from './useRecentGames';

export interface MarkovState {
  state: 'V' | 'E' | 'D'; // Vitória, Empate, Derrota
  probability: number;
}

export interface TransitionMatrix {
  V: { V: number; E: number; D: number };
  E: { V: number; E: number; D: number };
  D: { V: number; E: number; D: number };
}

export interface MarkovPrediction {
  homeWin: number;
  draw: number;
  awayWin: number;
  confidence: number;
  homeTransitionMatrix: TransitionMatrix;
  awayTransitionMatrix: TransitionMatrix;
  homeLastState: 'V' | 'E' | 'D' | null;
  awayLastState: 'V' | 'E' | 'D' | null;
  homeGamesAnalyzed: number;
  awayGamesAnalyzed: number;
}

const getGameResult = (match: RecentGameMatch, teamName: string, isHome: boolean): 'V' | 'E' | 'D' | null => {
  if (!match.Goals_Home && match.Goals_Home !== 0) return null;
  if (!match.Goals_Away && match.Goals_Away !== 0) return null;

  const homeGoals = match.Goals_Home;
  const awayGoals = match.Goals_Away;

  if (homeGoals === awayGoals) return 'E';
  
  if (isHome) {
    return homeGoals > awayGoals ? 'V' : 'D';
  } else {
    return awayGoals > homeGoals ? 'V' : 'D';
  }
};

const buildTransitionMatrix = (results: ('V' | 'E' | 'D')[]): TransitionMatrix => {
  const matrix: TransitionMatrix = {
    V: { V: 0, E: 0, D: 0 },
    E: { V: 0, E: 0, D: 0 },
    D: { V: 0, E: 0, D: 0 }
  };

  const counts = {
    V: { V: 0, E: 0, D: 0 },
    E: { V: 0, E: 0, D: 0 },
    D: { V: 0, E: 0, D: 0 }
  };

  // Contar transições
  for (let i = 0; i < results.length - 1; i++) {
    const currentState = results[i];
    const nextState = results[i + 1];
    counts[currentState][nextState]++;
  }

  // Calcular probabilidades
  (['V', 'E', 'D'] as const).forEach(state => {
    const total = counts[state].V + counts[state].E + counts[state].D;
    if (total > 0) {
      matrix[state].V = counts[state].V / total;
      matrix[state].E = counts[state].E / total;
      matrix[state].D = counts[state].D / total;
    } else {
      // Se não há dados, usar distribuição uniforme
      matrix[state].V = 1/3;
      matrix[state].E = 1/3;
      matrix[state].D = 1/3;
    }
  });

  return matrix;
};

const calculateMatchProbabilities = (
  homeMatrix: TransitionMatrix,
  awayMatrix: TransitionMatrix,
  homeLastState: 'V' | 'E' | 'D' | null,
  awayLastState: 'V' | 'E' | 'D' | null
): { homeWin: number; draw: number; awayWin: number } => {
  // Probabilidades do próximo resultado baseado no último estado
  const homeProbs = homeLastState ? homeMatrix[homeLastState] : { V: 1/3, E: 1/3, D: 1/3 };
  const awayProbs = awayLastState ? awayMatrix[awayLastState] : { V: 1/3, E: 1/3, D: 1/3 };

  // Combinação das probabilidades
  // Se o time da casa vence e o visitante não vence
  const homeWin = homeProbs.V * (awayProbs.E + awayProbs.D);
  
  // Se ambos empatam ou situações que levam ao empate
  const draw = (homeProbs.E * awayProbs.E) + 
               (homeProbs.V * awayProbs.V * 0.3) + // Ajuste para jogos competitivos
               (homeProbs.D * awayProbs.D * 0.2);   // Ajuste para jogos defensivos
  
  // Se o time visitante vence e o da casa não vence
  const awayWin = awayProbs.V * (homeProbs.E + homeProbs.D);

  // Normalizar para somar 100%
  const total = homeWin + draw + awayWin;
  
  return {
    homeWin: (homeWin / total) * 100,
    draw: (draw / total) * 100,
    awayWin: (awayWin / total) * 100
  };
};

export const useMarkovChain = (homeTeam?: string, awayTeam?: string) => {
  const { data: homeGames, isLoading: homeLoading } = useRecentGames(homeTeam, undefined);
  const { data: awayGames, isLoading: awayLoading } = useRecentGames(undefined, awayTeam);

  return useQuery<MarkovPrediction>({
    queryKey: ['markovChain', homeTeam, awayTeam],
    queryFn: () => {
      if (!homeTeam || !awayTeam || !homeGames || !awayGames) {
        throw new Error('Dados insuficientes para análise');
      }

      console.log('=== ANÁLISE CADEIAS DE MARKOV ===');
      console.log('Time Casa:', homeTeam, '- Jogos encontrados:', homeGames.length);
      console.log('Time Visitante:', awayTeam, '- Jogos encontrados:', awayGames.length);

      // Filtrar apenas jogos em casa para o time da casa
      const homeResults: ('V' | 'E' | 'D')[] = homeGames
        .filter(game => game.Team_Home.toLowerCase().includes(homeTeam.toLowerCase()))
        .slice(0, 6) // Últimos 6 jogos
        .map(game => getGameResult(game, homeTeam, true))
        .filter(result => result !== null) as ('V' | 'E' | 'D')[];

      // Filtrar apenas jogos fora para o time visitante
      const awayResults: ('V' | 'E' | 'D')[] = awayGames
        .filter(game => game.Team_Away.toLowerCase().includes(awayTeam.toLowerCase()))
        .slice(0, 6) // Últimos 6 jogos
        .map(game => getGameResult(game, awayTeam, false))
        .filter(result => result !== null) as ('V' | 'E' | 'D')[];

      console.log('Resultados Casa (últimos 6):', homeResults);
      console.log('Resultados Fora (últimos 6):', awayResults);

      // Construir matrizes de transição
      const homeMatrix = buildTransitionMatrix(homeResults);
      const awayMatrix = buildTransitionMatrix(awayResults);

      // Estado atual (último jogo)
      const homeLastState = homeResults.length > 0 ? homeResults[0] : null;
      const awayLastState = awayResults.length > 0 ? awayResults[0] : null;

      console.log('Último estado Casa:', homeLastState);
      console.log('Último estado Fora:', awayLastState);
      console.log('Matriz Casa:', homeMatrix);
      console.log('Matriz Fora:', awayMatrix);

      // Calcular probabilidades do confronto
      const probabilities = calculateMatchProbabilities(
        homeMatrix,
        awayMatrix,
        homeLastState,
        awayLastState
      );

      // Calcular confiança baseada na quantidade de dados
      const confidence = Math.min(
        ((homeResults.length + awayResults.length) / 12) * 100,
        100
      );

      console.log('Probabilidades calculadas:', probabilities);
      console.log('Confiança:', confidence);

      return {
        homeWin: probabilities.homeWin,
        draw: probabilities.draw,
        awayWin: probabilities.awayWin,
        confidence,
        homeTransitionMatrix: homeMatrix,
        awayTransitionMatrix: awayMatrix,
        homeLastState,
        awayLastState,
        homeGamesAnalyzed: homeResults.length,
        awayGamesAnalyzed: awayResults.length
      };
    },
    enabled: !!homeTeam && !!awayTeam && !homeLoading && !awayLoading && !!homeGames && !!awayGames,
    staleTime: 10 * 60 * 1000,
    retry: 2
  });
};
