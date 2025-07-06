
import {
  TeamStats,
  LeagueAverageData,
  GoalsHalfStats,
  ScoredFirstStats,
  GoalMomentStats
} from '@/types/goalStats';

export const parseCSV = (csvText: string): TeamStats[] => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');

  const parsedData = lines.slice(1).map(line => {
    const values = line.split(',');
    const stats: any = {};

    headers.forEach((header, i) => {
      const h = header.trim().replace(/"/g, '');
      const v = values[i]?.trim().replace(/"/g, '') || '';

      if (h.toLowerCase().includes('team')) stats.Team = v;
      else if (h === 'League_Name') stats.League_Name = v;
      else stats[h] = parseFloat(v.replace('%', '')) || 0;
    });

    return stats as TeamStats;
  }).filter(team =>
    team.Team &&
    !team.Team.toLowerCase().includes('league average') &&
    !(team.Team.includes(' - ') && (!team.GP || team.GP === 0))
  );

  return parsedData;
};

export const parseLeagueAveragesCSV = (csvText: string): LeagueAverageData[] => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    const values = line.split(',');
    const league: any = {};

    headers.forEach((header, i) => {
      const h = header.trim().replace(/"/g, '');
      let v = values[i]?.trim().replace(/"/g, '') || '';

      if (h === 'League_Name') league.League_Name = v;
      else league[h] = parseFloat(v.replace('%', '')) || 0;
    });

    return league as LeagueAverageData;
  });
};

export const parseGoalsHalfCSV = (csvText: string): GoalsHalfStats[] => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    const values = line.split(',');
    const stats: any = {};

    headers.forEach((header, i) => {
      const h = header.trim().replace(/"/g, '');
      let v = values[i]?.trim().replace(/"/g, '') || '';

      if (h === 'Team') stats.Team = v;
      else stats[h] = parseFloat(v.replace('%', '')) || 0;
    });

    return stats as GoalsHalfStats;
  }).filter(s => s.Team && s.Team.trim() !== '');
};

export const parseScoredFirstCSV = (csvText: string): ScoredFirstStats[] => {
  if (!csvText || csvText.trim() === '') return [];
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const sep = lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(sep).map(h => h.trim().replace(/"/g, ''));
  const teamHeader = headers.find(h => h.toLowerCase().startsWith('team'));
  if (!teamHeader) return [];

  return lines.slice(1).map(line => {
    const values = line.split(sep);
    const stats: any = {};

    headers.forEach((header, i) => {
      const h = header.trim().replace(/"/g, '');
      let v = values[i]?.trim().replace(/"/g, '') || '';

      if (h === teamHeader) stats.Team = v;
      else if (h.toLowerCase() === 'league') stats.League = v;
      else stats[h] = parseFloat(v.replace('%', '')) || 0;
    });

    return stats as ScoredFirstStats;
  }).filter(s => s.Team && s.Team.trim() !== '' && s['Perc.'] !== undefined);
};

export const parseGoalMomentCSV = (csvText: string): GoalMomentStats[] => {
  if (!csvText || csvText.trim() === '') return [];
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const sep = lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(sep).map(h => h.trim().replace(/"/g, ''));
  const teamHeader = headers.find(h => h.toLowerCase().includes('team'));
  if (!teamHeader) return [];

  return lines.slice(1).map(line => {
    const values = line.split(sep);
    const stats: any = {};

    headers.forEach((header, i) => {
      const h = header.trim().replace(/"/g, '');
      let v = values[i]?.trim().replace(/"/g, '') || '';

      if (h === teamHeader) stats.Team = v;
      else stats[h] = parseFloat(v.replace('%', '')) || 0;
    });

    return stats as GoalMomentStats;
  }).filter(s => s.Team && s.Team.trim() !== '');
};
