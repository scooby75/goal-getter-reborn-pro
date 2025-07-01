
import { TeamStats, LeagueAverageData, GoalsHalfStats, ScoredFirstStats, GoalMomentStats } from '@/types/goalStats';

export const parseCSV = (csvText: string): TeamStats[] => {
  console.log('Parsing CSV data...');
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  console.log('CSV Headers:', headers);
  console.log('Total lines:', lines.length);
  
  const parsedData = lines.slice(1).map((line, index) => {
    const values = line.split(',');
    const stats: any = {};
    
    headers.forEach((header, headerIndex) => {
      const cleanHeader = header.trim().replace(/"/g, '');
      const cleanValue = values[headerIndex]?.trim().replace(/"/g, '') || '';
      
      if (cleanHeader === 'Team' || cleanHeader === 'team' || cleanHeader.toLowerCase().includes('team')) {
        stats.Team = cleanValue;
      } else if (cleanHeader === 'League_Name') {
        stats.League_Name = cleanValue;
      } else {
        stats[cleanHeader] = parseFloat(cleanValue) || 0;
      }
    });
    
    return stats as TeamStats;
  }).filter(team => {
    const teamName = team.Team;
    
    if (!teamName || teamName.trim() === '') {
      return false;
    }
    
    if (teamName.toLowerCase().includes('league average')) {
      return false;
    }
    
    if (teamName.includes(' - ') && (!team.GP || team.GP === 0)) {
      return false;
    }
    
    return true;
  });

  console.log('Parsed and filtered data count:', parsedData.length);
  console.log('Sample teams:', parsedData.slice(0, 10).map(team => `${team.Team} (${team.League_Name})`));
  
  return parsedData;
};

export const parseLeagueAveragesCSV = (csvText: string): LeagueAverageData[] => {
  console.log('Parsing League Averages CSV data...');
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  console.log('League CSV Headers:', headers);
  console.log('Total league lines:', lines.length);
  
  const parsedData = lines.slice(1).map((line) => {
    const values = line.split(',');
    const league: any = {};
    
    headers.forEach((header, headerIndex) => {
      const cleanHeader = header.trim().replace(/"/g, '');
      let cleanValue = values[headerIndex]?.trim().replace(/"/g, '') || '';
      
      if (cleanHeader === 'League_Name') {
        league.League_Name = cleanValue;
      } else {
        if (cleanValue.includes('%')) {
          cleanValue = cleanValue.replace('%', '');
        }
        league[cleanHeader] = parseFloat(cleanValue) || 0;
      }
    });
    
    return league as LeagueAverageData;
  });

  console.log('Parsed league averages count:', parsedData.length);
  console.log('Sample leagues:', parsedData.slice(0, 5).map(league => league.League_Name));
  
  return parsedData;
};

export const parseGoalsHalfCSV = (csvText: string): GoalsHalfStats[] => {
  console.log('Parsing Goals Half CSV data...');
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  const parsedData = lines.slice(1).map((line) => {
    const values = line.split(',');
    const stats: any = {};
    
    headers.forEach((header, headerIndex) => {
      const cleanHeader = header.trim().replace(/"/g, '');
      let cleanValue = values[headerIndex]?.trim().replace(/"/g, '') || '';
      
      if (cleanHeader === 'Team') {
        stats.Team = cleanValue;
      } else {
        if (cleanValue.includes('%')) {
          cleanValue = cleanValue.replace('%', '');
        }
        stats[cleanHeader] = parseFloat(cleanValue) || 0;
      }
    });
    
    return stats as GoalsHalfStats;
  }).filter(s => s.Team && s.Team.trim() !== '');

  console.log('Parsed goals half stats count:', parsedData.length);
  return parsedData;
};

export const parseScoredFirstCSV = (csvText: string): ScoredFirstStats[] => {
  console.log('Parsing Scored First CSV data...');
  if (!csvText || csvText.trim() === '') {
    console.warn('Scored First CSV text is empty or invalid.');
    return [];
  }
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    console.warn('Scored First CSV has no data rows.');
    return [];
  }

  const separator = lines[0].includes('\t') ? '\t' : ',';

  const headers = lines[0].split(separator).map(h => h.trim().replace(/"/g, ''));
  console.log('Scored First CSV Headers:', headers);
  
  const teamHeader = headers.find(h => h.toLowerCase().startsWith('team'));
  if (!teamHeader) {
    console.error('Team column not found in scored first CSV');
    return [];
  }
  console.log('Using team header:', teamHeader);

  const parsedData = lines.slice(1).map((line) => {
    const values = line.split(separator);
    const stats: any = {};
    
    headers.forEach((header, headerIndex) => {
      const cleanHeader = header.trim().replace(/"/g, '');
      let cleanValue = values[headerIndex]?.trim().replace(/"/g, '') || '';
      
      if (cleanHeader === teamHeader) {
        stats.Team = cleanValue;
      } else if (cleanHeader.toLowerCase() === 'league') {
        stats.League = cleanValue;
      }
      else {
        if (cleanValue.includes('%')) {
          cleanValue = cleanValue.replace('%', '');
        }
        stats[cleanHeader] = parseFloat(cleanValue) || 0;
      }
    });
    
    return stats as ScoredFirstStats;
  }).filter(s => s.Team && s.Team.trim() !== '' && s['Perc.'] !== undefined);

  console.log(`Parsed scored first stats count: ${parsedData.length}`);
  if(parsedData.length > 0) {
    console.log('Sample of parsed scored first data:', parsedData.slice(0, 5));
  }
  return parsedData;
};

export const parseGoalMomentCSV = (csvText: string): GoalMomentStats[] => {
  console.log('Parsing Goal Moment CSV data...');
  if (!csvText || csvText.trim() === '') {
    console.warn('Goal Moment CSV text is empty or invalid.');
    return [];
  }
  
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    console.warn('Goal Moment CSV has no data rows.');
    return [];
  }

  const separator = lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(separator).map(h => h.trim().replace(/"/g, ''));
  console.log('Goal Moment CSV Headers:', headers);
  
  const teamHeader = headers.find(h => h.toLowerCase().includes('team'));
  if (!teamHeader) {
    console.error('Team column not found in goal moment CSV');
    return [];
  }

  const parsedData = lines.slice(1).map((line) => {
    const values = line.split(separator);
    const stats: any = {};
    
    headers.forEach((header, headerIndex) => {
      const cleanHeader = header.trim().replace(/"/g, '');
      let cleanValue = values[headerIndex]?.trim().replace(/"/g, '') || '';
      
      if (cleanHeader === teamHeader) {
        stats.Team = cleanValue;
      } else {
        stats[cleanHeader] = parseFloat(cleanValue) || 0;
      }
    });
    
    return stats as GoalMomentStats;
  }).filter(s => s.Team && s.Team.trim() !== '');

  console.log(`Parsed goal moment stats count: ${parsedData.length}`);
  return parsedData;
};
