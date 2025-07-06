
import { useQuery } from '@tanstack/react-query';
import { fetchCSVWithRetry } from '@/utils/csvHelpers';

export interface HeadToHeadMatch {
  League: string;
  Date: string;
  Original_Date: string;
  Team_Home: string;
  Team_Away: string;
  HT_Score: string;
  Score: string;
  Over_2_5: string;
  Total_Goals: string;
  Both_Teams_Scored: string;
  Status: string;
}

const parseHeadToHeadCSV = (csvText: string): HeadToHeadMatch[] => {
  try {
    console.log('Parsing Head to Head CSV data...');
    console.log('Raw CSV text length:', csvText.length);
    console.log('First 500 characters:', csvText.substring(0, 500));
    
    if (!csvText || typeof csvText !== 'string') {
      throw new Error('Invalid CSV data: empty or not a string');
    }

    const lines = csvText.trim().split('\n');
    
    if (lines.length < 2) {
      throw new Error('CSV file has no data rows');
    }

    // Parse headers more carefully, handling potential quotes and commas
    const headerLine = lines[0];
    console.log('Header line:', headerLine);
    
    // Split by comma but respect quoted values
    const headers = headerLine.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || headerLine.split(',');
    const cleanHeaders = headers.map(h => h.trim().replace(/^"|"$/g, ''));
    
    console.log('Parsed headers:', cleanHeaders);
    
    // Check for required headers with more flexible matching
    const findHeader = (searchTerm: string) => {
      return cleanHeaders.find(h => 
        h.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.toLowerCase().replace(/[_\s]/g, '') === searchTerm.toLowerCase().replace(/[_\s]/g, '')
      );
    };

    const dateHeader = findHeader('date') || findHeader('data');
    const homeTeamHeader = findHeader('home') || findHeader('casa') || findHeader('team_home');
    const awayTeamHeader = findHeader('away') || findHeader('visitante') || findHeader('team_away');
    const scoreHeader = findHeader('score') || findHeader('placar') || findHeader('resultado');

    console.log('Found headers:', { dateHeader, homeTeamHeader, awayTeamHeader, scoreHeader });

    if (!dateHeader || !homeTeamHeader || !awayTeamHeader || !scoreHeader) {
      console.error('Missing required headers. Available headers:', cleanHeaders);
      throw new Error(`Missing required headers. Found: ${cleanHeaders.join(', ')}`);
    }

    const parsedData = lines.slice(1).map((line, index) => {
      try {
        // Parse line more carefully, handling quotes and commas
        const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
        const cleanValues = values.map(v => v.trim().replace(/^"|"$/g, ''));
        
        if (cleanValues.length < cleanHeaders.length - 2) { // Allow some tolerance
          console.warn(`Line ${index + 2} has fewer values than expected:`, cleanValues.length, 'vs', cleanHeaders.length);
        }

        const match: Partial<HeadToHeadMatch> = {};
        
        cleanHeaders.forEach((header, headerIndex) => {
          const value = cleanValues[headerIndex]?.trim() || '';
          
          // Map headers to match interface
          if (header === dateHeader) {
            match.Date = value;
          } else if (header === homeTeamHeader) {
            match.Team_Home = value;
          } else if (header === awayTeamHeader) {
            match.Team_Away = value;
          } else if (header === scoreHeader) {
            match.Score = value;
          } else if (header.toLowerCase().includes('league') || header.toLowerCase().includes('liga')) {
            match.League = value;
          } else if (header.toLowerCase().includes('ht') || header.toLowerCase().includes('intervalo')) {
            match.HT_Score = value;
          } else if (header.toLowerCase().includes('over') && header.includes('2.5')) {
            match.Over_2_5 = value;
          } else if (header.toLowerCase().includes('total') && header.toLowerCase().includes('goal')) {
            match.Total_Goals = value;
          } else if (header.toLowerCase().includes('both') || header.toLowerCase().includes('ambos')) {
            match.Both_Teams_Scored = value;
          } else if (header.toLowerCase().includes('status')) {
            match.Status = value;
          } else if (header.toLowerCase().includes('original') && header.toLowerCase().includes('date')) {
            match.Original_Date = value;
          }
        });
        
        // Validate required fields
        if (!match.Date || !match.Team_Home || !match.Team_Away || !match.Score) {
          console.warn(`Invalid match data at line ${index + 2}:`, match);
          return null;
        }

        // Set default values for optional fields
        match.League = match.League || 'Unknown';
        match.HT_Score = match.HT_Score || '0-0';
        match.Over_2_5 = match.Over_2_5 || '';
        match.Total_Goals = match.Total_Goals || '';
        match.Both_Teams_Scored = match.Both_Teams_Scored || '';
        match.Status = match.Status || 'FT';
        match.Original_Date = match.Original_Date || match.Date;
        
        return match as HeadToHeadMatch;
      } catch (error) {
        console.error(`Error parsing line ${index + 2}:`, error, 'Line content:', line);
        return null;
      }
    }).filter((match): match is HeadToHeadMatch => match !== null);

    console.log(`Successfully parsed ${parsedData.length} head to head matches`);
    if (parsedData.length > 0) {
      console.log('Sample matches:', parsedData.slice(0, 3));
    }
    
    return parsedData;
  } catch (error) {
    console.error('Error parsing head to head CSV:', error);
    throw error;
  }
};

export const useHeadToHead = (team1?: string, team2?: string) => {
  return useQuery({
    queryKey: ['headToHead', team1, team2],
    queryFn: async () => {
      try {
        console.log('Fetching head to head data...');
        const csvText = await fetchCSVWithRetry(
          'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/refs/heads/main/public/Data/all_leagues_results.csv'
        );
        
        console.log('CSV data fetched, parsing...');
        const allMatches = parseHeadToHeadCSV(csvText);
        
        console.log(`Total matches parsed: ${allMatches.length}`);
        
        // Filter by specific teams if provided
        if (team1 && team2) {
          const filteredMatches = allMatches.filter(match => 
            (match.Team_Home === team1 && match.Team_Away === team2) ||
            (match.Team_Home === team2 && match.Team_Away === team1)
          );
          console.log(`Filtered matches for ${team1} vs ${team2}: ${filteredMatches.length}`);
          return filteredMatches;
        }
        
        return allMatches;
      } catch (error) {
        console.error('Failed to fetch or parse head to head data:', error);
        throw new Error(`Failed to load match data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    enabled: true, // Always enable the query
  });
};
