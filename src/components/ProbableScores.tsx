
import React from 'react';
import { AdvancedScorePrediction } from './AdvancedScorePrediction';
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
    <AdvancedScorePrediction 
      homeStats={homeStats} 
      awayStats={awayStats} 
    />
  );
};
