
import React from 'react';
import { MarkovChainPrediction } from './MarkovChainPrediction';
import { TeamStats } from '@/types/goalStats';

interface ProbableScoresProps {
  homeStats?: TeamStats;
  awayStats?: TeamStats;
}

export const ProbableScores: React.FC<ProbableScoresProps> = ({
  homeStats,
  awayStats,
}) => {
  return (
    <MarkovChainPrediction 
      homeStats={homeStats} 
      awayStats={awayStats} 
    />
  );
};
