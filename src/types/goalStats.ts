
export interface TeamStats {
  Team: string;
  League_Name: string;
  GP: number;
  "0.5+": number;
  "1.5+": number;
  "2.5+": number;
  "3.5+": number;
  "4.5+": number;
  "5.5+": number;
  BTS: number;
  CS: number;
  Goals?: number;
  Avg?: number;
  "1st half"?: number;
  "2nd half"?: number;
  "Avg. minute"?: number;
  scoredFirstPerc?: number;
}

export interface LeagueAverageData {
  League_Name: string;
  "0.5+": number;
  "1.5+": number;
  "2.5+": number;
  "3.5+": number;
  "4.5+": number;
  "5.5+": number;
  BTS: number;
  CS: number;
}

export interface GoalsHalfStats {
  Team: string;
  "1st half": number;
  "2nd half": number;
  "Avg. minute": number;
}

export interface ScoredFirstStats {
  Team: string;
  League?: string;
  "Perc.": number;
}

export interface GoalMomentStats {
  Team: string;
  "0-15_mar": number;
  "16-30_mar": number;
  "31-45_mar": number;
  "46-60_mar": number;
  "61-75_mar": number;
  "76-90_mar": number;
  "0-15_sofri": number;
  "16-30_sofri": number;
  "31-45_sofri": number;
  "46-60_sofri": number;
  "61-75_sofri": number;
  "76-90_sofri": number;
}

export interface GoalStatsData {
  homeStats: TeamStats[];
  awayStats: TeamStats[];
  overallStats: TeamStats[];
  leagueAverage: {
    "1.5+": number;
    "2.5+": number;
    "3.5+": number;
    "4.5+": number;
  };
  leagueAverages: LeagueAverageData[];
  homeGoalMoments?: GoalMomentStats[];
  awayGoalMoments?: GoalMomentStats[];
}
