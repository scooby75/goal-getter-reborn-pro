
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
    console.log('=== PARSING HEAD TO HEAD CSV ===');
    console.log('Raw CSV text length:', csvText.length);
    console.log('First 1000 characters:', csvText.substring(0, 1000));
    
    if (!csvText || typeof csvText !== 'string') {
      throw new Error('Invalid CSV data: empty or not a string');
    }

    const lines = csvText.trim().split(/\r?\n/);
    console.log('Total lines found:', lines.length);
    
    if (lines.length < 2) {
      throw new Error('CSV file has no data rows');
    }

    // Parse headers
    const headerLine = lines[0];
    console.log('Raw header line:', headerLine);
    
    // Handle different CSV formats (comma or tab separated)
    const separator = headerLine.includes('\t') ? '\t' : ',';
    console.log('Using separator:', separator === '\t' ? 'TAB' : 'COMMA');
    
    const headers = headerLine.split(separator).map(h => h.trim().replace(/^"|"$/g, ''));
    console.log('Parsed headers:', headers);
    console.log('Headers count:', headers.length);
    
    // Find key headers with flexible matching
    const findHeaderIndex = (searchTerms: string[]) => {
      for (const term of searchTerms) {
        const index = headers.findIndex(h => 
          h.toLowerCase().includes(term.toLowerCase()) ||
          h.toLowerCase().replace(/[_\s]/g, '') === term.toLowerCase().replace(/[_\s]/g, '')
        );
        if (index !== -1) return index;
      }
      return -1;
    };

    const dateIndex = findHeaderIndex(['date', 'data']);
    const homeTeamIndex = findHeaderIndex(['team_home', 'home', 'casa']);
    const awayTeamIndex = findHeaderIndex(['team_away', 'away', 'visitante']);
    const scoreIndex = findHeaderIndex(['score', 'placar', 'resultado']);
    const leagueIndex = findHeaderIndex(['league', 'liga']);

    console.log('Header indices found:', {
      date: dateIndex,
      home: homeTeamIndex,
      away: awayTeamIndex,
      score: scoreIndex,
      league: leagueIndex
    });

    if (dateIndex === -1 || homeTeamIndex === -1 || awayTeamIndex === -1 || scoreIndex === -1) {
      console.error('Missing required headers. Available headers:', headers);
      throw new Error(`Missing required headers. Found: ${headers.join(', ')}`);
    }

    console.log('Starting to parse data rows...');
    let validMatches = 0;
    let invalidMatches = 0;

    const parsedData = lines.slice(1).map((line, index) => {
      try {
        const values = line.split(separator).map(v => v.trim().replace(/^"|"$/g, ''));
        
        if (values.length < Math.max(dateIndex, homeTeamIndex, awayTeamIndex, scoreIndex) + 1) {
          console.warn(`Line ${index + 2} has insufficient values:`, values.length, 'vs required indices');
          invalidMatches++;
          return null;
        }

        const match: HeadToHeadMatch = {
          League: leagueIndex !== -1 ? (values[leagueIndex] || 'Unknown') : 'Unknown',
          Date: values[dateIndex] || '',
          Original_Date: values[dateIndex] || '',
          Team_Home: values[homeTeamIndex] || '',
          Team_Away: values[awayTeamIndex] || '',
          HT_Score: '0-0',
          Score: values[scoreIndex] || '',
          Over_2_5: '',
          Total_Goals: '',
          Both_Teams_Scored: '',
          Status: 'FT'
        };
        
        // Log specific matches for debugging
        if (match.Team_Home.toLowerCase().includes('flamengo') || match.Team_Away.toLowerCase().includes('flamengo') ||
            match.Team_Home.toLowerCase().includes('bahia') || match.Team_Away.toLowerCase().includes('bahia')) {
          console.log(`FOUND FLAMENGO/BAHIA MATCH: ${match.Team_Home} vs ${match.Team_Away} (${match.Date}) - Score: ${match.Score}`);
        }
        
        // Validate required fields
        if (!match.Date || !match.Team_Home || !match.Team_Away || !match.Score) {
          console.warn(`Invalid match data at line ${index + 2}:`, {
            date: match.Date,
            home: match.Team_Home,
            away: match.Team_Away,
            score: match.Score
          });
          invalidMatches++;
          return null;
        }

        validMatches++;
        return match;
      } catch (error) {
        console.error(`Error parsing line ${index + 2}:`, error, 'Line content:', line);
        invalidMatches++;
        return null;
      }
    }).filter((match): match is HeadToHeadMatch => match !== null);

    console.log(`=== PARSING COMPLETE ===`);
    console.log(`Valid matches: ${validMatches}`);
    console.log(`Invalid matches: ${invalidMatches}`);
    console.log(`Total parsed matches: ${parsedData.length}`);
    
    if (parsedData.length > 0) {
      console.log('Sample matches:', parsedData.slice(0, 5));
      
      // Check for Flamengo vs Bahia specifically
      const flaBahiaMatches = parsedData.filter(match => 
        (match.Team_Home.toLowerCase().includes('flamengo') && match.Team_Away.toLowerCase().includes('bahia')) ||
        (match.Team_Home.toLowerCase().includes('bahia') && match.Team_Away.toLowerCase().includes('flamengo'))
      );
      console.log(`Flamengo vs Bahia matches found: ${flaBahiaMatches.length}`, flaBahiaMatches);
    }
    
    return parsedData;
  } catch (error) {
    console.error('=== CSV PARSING ERROR ===', error);
    throw error;
  }
};

export const useHeadToHead = (team1?: string, team2?: string) => {
  return useQuery({
    queryKey: ['headToHead', team1, team2],
    queryFn: async () => {
      try {
        console.log('=== STARTING HEAD TO HEAD FETCH ===');
        console.log('Requested teams:', { team1, team2 });
        console.log('Browser info:', {
          userAgent: navigator.userAgent,
          location: window.location.href,
          origin: window.location.origin
        });
        
        const csvText = await fetchCSVWithRetry(
          'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/refs/heads/main/public/Data/all_leagues_results.csv'
        );
        
        console.log('CSV data fetched successfully, starting parse...');
        const allMatches = parseHeadToHeadCSV(csvText);
        
        console.log(`=== FILTERING MATCHES ===`);
        console.log(`Total matches available: ${allMatches.length}`);
        
        // Filter by specific teams if provided
        if (team1 && team2) {
          console.log(`Filtering for direct matches between "${team1}" and "${team2}"`);
          
          const filteredMatches = allMatches.filter(match => {
            const homeTeam = match.Team_Home.toLowerCase().trim();
            const awayTeam = match.Team_Away.toLowerCase().trim();
            const searchTeam1 = team1.toLowerCase().trim();
            const searchTeam2 = team2.toLowerCase().trim();
            
            const isDirectMatch = (
              (homeTeam === searchTeam1 && awayTeam === searchTeam2) ||
              (homeTeam === searchTeam2 && awayTeam === searchTeam1) ||
              (homeTeam.includes(searchTeam1) && awayTeam.includes(searchTeam2)) ||
              (homeTeam.includes(searchTeam2) && awayTeam.includes(searchTeam1))
            );
            
            if (isDirectMatch) {
              console.log(`MATCH FOUND: ${match.Team_Home} vs ${match.Team_Away} (${match.Date})`);
            }
            
            return isDirectMatch;
          });
          
          console.log(`Direct matches found: ${filteredMatches.length}`);
          return filteredMatches.sort((a, b) => {
            try {
              return new Date(b.Date).getTime() - new Date(a.Date).getTime();
            } catch {
              return 0;
            }
          });
        }
        
        return allMatches;
      } catch (error) {
        console.error('=== HEAD TO HEAD FETCH ERROR ===', error);
        
        // Enhanced error information
        if (error instanceof Error) {
          console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        }
        
        // Check if it's a network/CORS error
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new Error(`Erro de rede ou CORS: Não foi possível acessar o arquivo CSV. Verifique se o arquivo está acessível publicamente e se não há bloqueios de CORS.`);
        }
        
        throw new Error(`Falha ao carregar dados dos confrontos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1, // Reduce retries since we handle them in fetchCSVWithRetry
    enabled: true,
  });
};
