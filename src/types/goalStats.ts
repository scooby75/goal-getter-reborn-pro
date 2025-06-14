export interface TeamStats {
  Team: string;
  League_Name?: string;
  GP: number;
  Avg: number;
  "0.5+"?: number;
  "1.5+": number;
  "2.5+": number;
  "3.5+": number;
  "4.5+": number;
  "5.5+"?: number;
  "1st half"?: number;
  "2nd half"?: number;
  "Avg. minute"?: number;
  scoredFirstPerc?: number;
}

export interface GoalsHalfStats {
  Team: string;
  "1st half": number;
  "2nd half": number;
  "Avg. minute": number;
}

export interface ScoredFirstStats {
  Team: string;
  "Perc.": number;
}

export interface LeagueAverageData {
  League_Name: string;
  "0.5+": number;
  "1.5+": number;
  "2.5+": number;
  "3.5+": number;
  "4.5+": number;
  "5.5+": number;
  GP?: number;
  Avg?: number;
  BTS?: number;
  CS?: number;
  FTS?: number;
  WTN?: number;
  LTN?: number;
}

export interface LeagueStats {
  "1.5+": number;
  "2.5+": number;
  "3.5+": number;
  "4.5+": number;
}

export interface GoalStatsData {
  homeStats: TeamStats[];
  awayStats: TeamStats[];
  overallStats: TeamStats[];
  leagueAverage: LeagueStats;
  leagueAverages: LeagueAverageData[];
}
