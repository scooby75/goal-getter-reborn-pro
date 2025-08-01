
import { useQuery } from '@tanstack/react-query';
import Papa from 'papaparse';

export interface ScoreData {
  League: string;
  FT_Score?: string;
  HT_Score?: string;
  Matches: string;
  Percentage: string;
}

export interface ScoreFrequency {
  score: string;
  count: number;
  percentage: number;
}

const QUERY_CONFIG = {
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
  staleTime: 10 * 60 * 1000,
  gcTime: 20 * 60 * 1000,
} as const;

const fetchScoreData = async (filename: string): Promise<ScoreData[]> => {
  try {
    console.log(`Fetching score data from: ${filename}`);
    const response = await fetch(`/Data/${filename}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csvText = await response.text();
    console.log(`CSV text preview for ${filename}:`, csvText.substring(0, 500));
    
    const result = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transform: (value, field) => {
        // Clean up field values
        return typeof value === 'string' ? value.trim() : value;
      }
    });

    if (!result.data || result.data.length === 0) {
      throw new Error('No data found in CSV');
    }

    console.log(`Parsed data sample for ${filename}:`, result.data.slice(0, 5));
    console.log(`CSV Headers:`, Object.keys(result.data[0] || {}));
    
    return result.data as ScoreData[];
  } catch (error) {
    console.error(`Erro ao carregar dados de ${filename}:`, error);
    throw new Error(`Falha ao carregar dados de ${filename}`);
  }
};

const processScoreFrequency = (data: ScoreData[], scoreField: 'FT_Score' | 'HT_Score'): ScoreFrequency[] => {
  console.log(`Processing score frequency for field: ${scoreField}`);
  console.log('Raw data sample:', data.slice(0, 5));
  
  if (!data || data.length === 0) {
    console.log('No data to process');
    return [];
  }

  const processed = data
    .filter(item => {
      const score = item[scoreField];
      const matches = item.Matches;
      const percentage = item.Percentage;
      
      const isValid = score && score.trim() && matches && percentage && 
                     score !== 'undefined' && matches !== 'undefined' && percentage !== 'undefined';
      
      if (!isValid) {
        console.log('Filtered out invalid item:', { score, matches, percentage });
      }
      
      return isValid;
    })
    .map(item => {
      const score = (item[scoreField] || '').trim();
      const matchesStr = (item.Matches || '0').toString().trim();
      const percentageStr = (item.Percentage || '0').toString().trim();
      
      console.log(`Processing item: score=${score}, matches=${matchesStr}, percentage=${percentageStr}`);
      
      // Remove % symbol and convert to number
      const percentage = parseFloat(percentageStr.replace('%', '').replace(',', '.')) || 0;
      const count = parseInt(matchesStr) || 0;
      
      return {
        score: score,
        count,
        percentage: Math.round(percentage * 100) / 100 // Round to 2 decimal places
      };
    })
    .filter(item => item.score && item.count > 0) // Only valid scores with matches
    .sort((a, b) => b.percentage - a.percentage); // Sort by percentage descending

  console.log(`Processed ${processed.length} items for ${scoreField}:`, processed.slice(0, 5));
  return processed;
};

export const useScoreFrequency = () => {
  const ftQuery = useQuery<ScoreData[], Error>({
    queryKey: ['scoreFrequency', 'ft'],
    queryFn: () => fetchScoreData('full_time_scores.csv'),
    ...QUERY_CONFIG
  });

  const htQuery = useQuery<ScoreData[], Error>({
    queryKey: ['scoreFrequency', 'ht'],
    queryFn: () => fetchScoreData('half_time_scores.csv'),
    ...QUERY_CONFIG
  });

  const ftFrequency = ftQuery.data ? 
    processScoreFrequency(ftQuery.data, 'FT_Score') : [];
  
  const htFrequency = htQuery.data ? 
    processScoreFrequency(htQuery.data, 'HT_Score') : [];

  console.log('Final FT Frequency:', ftFrequency.slice(0, 8));
  console.log('Final HT Frequency:', htFrequency.slice(0, 8));

  return {
    data: {
      ft: ftQuery.data || [],
      ht: htQuery.data || []
    },
    htFrequency,
    ftFrequency,
    isLoading: ftQuery.isLoading || htQuery.isLoading,
    isError: ftQuery.isError || htQuery.isError,
    error: ftQuery.error || htQuery.error,
    refetch: () => {
      ftQuery.refetch();
      htQuery.refetch();
    }
  };
};
