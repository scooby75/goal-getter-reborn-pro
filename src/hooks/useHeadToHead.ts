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
    
    if (!csvText || typeof csvText !== 'string') {
      throw new Error('Invalid CSV data: empty or not a string');
    }

    const lines = csvText.trim().split('\n');
    
    if (lines.length < 2) {
      throw new Error('CSV file has no data rows');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    console.log('H2H CSV Headers:', headers);
    
    // Verifica se os cabeçalhos necessários existem
    const requiredHeaders = ['Date', 'Team_Home', 'Team_Away', 'Score'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    const parsedData = lines.slice(1).map((line, index) => {
      try {
        // Corrige divisão considerando valores com vírgulas
        const values = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(v => v.trim().replace(/"/g, ''));
        const match: Partial<HeadToHeadMatch> = {};
        
        headers.forEach((header, headerIndex) => {
          const cleanHeader = header.trim();
          const cleanValue = values[headerIndex]?.trim() || '';
          
          // Mapeamento dos cabeçalhos
          switch (cleanHeader) {
            case 'League':
              match.League = cleanValue;
              break;
            case 'Date':
              match.Date = cleanValue;
              break;
            case 'Original Date':
              match.Original_Date = cleanValue;
              break;
            case 'Team_Home':
              match.Team_Home = cleanValue;
              break;
            case 'Team_Away':
              match.Team_Away = cleanValue;
              break;
            case 'HT Score':
              match.HT_Score = cleanValue;
              break;
            case 'Score':
              match.Score = cleanValue;
              break;
            case 'Over 2.5':
              match.Over_2_5 = cleanValue;
              break;
            case 'Total Goals':
              match.Total_Goals = cleanValue;
              break;
            case 'Both Teams Scored':
              match.Both_Teams_Scored = cleanValue;
              break;
            case 'Status':
              match.Status = cleanValue;
              break;
          }
        });
        
        // Verifica se os campos obrigatórios estão preenchidos
        if (!match.Date || !match.Team_Home || !match.Team_Away || !match.Score) {
          console.warn(`Invalid match data at line ${index + 2}:`, match);
          return null;
        }
        
        return match as HeadToHeadMatch;
      } catch (error) {
        console.error(`Error parsing line ${index + 2}:`, error);
        return null;
      }
    }).filter((match): match is HeadToHeadMatch => match !== null);

    console.log(`Successfully parsed ${parsedData.length} head to head matches`);
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
        const csvText = await fetchCSVWithRetry(
          'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/refs/heads/main/public/Data/all_leagues_results.csv'
        );
        const allMatches = parseHeadToHeadCSV(csvText);
        
        // Filtra por times específicos se fornecidos
        if (team1 && team2) {
          return allMatches.filter(match => 
            (match.Team_Home === team1 && match.Team_Away === team2) ||
            (match.Team_Home === team2 && match.Team_Away === team1)
          );
        }
        
        return allMatches;
      } catch (error) {
        console.error('Failed to fetch or parse head to head data:', error);
        throw new Error('Failed to load match data. Please try again later.');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    onError: (error) => {
      console.error('Head to Head query error:', error);
    }
  });
};
