
import { useQuery } from '@tanstack/react-query';
import { fetchCSVWithRetry } from '@/utils/csvHelpers';

export interface HeadToHeadMatch {
  Date: string;
  Team_Home: string;
  Team_Away: string;
  HT_Score: string;
  Score: string;
}

const parseHeadToHeadCSV = (csvText: string): HeadToHeadMatch[] => {
  console.log('Parsing Head to Head CSV data...');
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  console.log('H2H CSV Headers:', headers);
  
  const parsedData = lines.slice(1).map((line) => {
    const values = line.split(',');
    const match: any = {};
    
    headers.forEach((header, headerIndex) => {
      const cleanHeader = header.trim().replace(/"/g, '');
      const cleanValue = values[headerIndex]?.trim().replace(/"/g, '') || '';
      
      if (cleanHeader === 'Date') {
        match.Date = cleanValue;
      } else if (cleanHeader === 'Team_Home') {
        match.Team_Home = cleanValue;
      } else if (cleanHeader === 'Team_Away') {
        match.Team_Away = cleanValue;
      } else if (cleanHeader === 'HT Score') {
        match.HT_Score = cleanValue;
      } else if (cleanHeader === 'Score') {
        match.Score = cleanValue;
      }
    });
    
    return match as HeadToHeadMatch;
  }).filter(match => 
    match.Date && 
    match.Team_Home && 
    match.Team_Away && 
    match.Score
  );

  console.log(`Parsed head to head matches count: ${parsedData.length}`);
  return parsedData;
};

export const useHeadToHead = () => {
  return useQuery({
    queryKey: ['headToHead'],
    queryFn: async () => {
      const csvText = await fetchCSVWithRetry(
        'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/refs/heads/main/public/Data/all_leagues_results.csv'
      );
      return parseHeadToHeadCSV(csvText);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};
