
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
    console.log(`CSV text preview for ${filename}:`, csvText.substring(0, 200));
    
    const result = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (!result.data) {
      throw new Error('Falha ao processar CSV');
    }

    console.log(`Parsed data sample for ${filename}:`, result.data.slice(0, 3));
    return result.data as ScoreData[];
  } catch (error) {
    console.error(`Erro ao carregar dados de ${filename}:`, error);
    throw new Error(`Falha ao carregar dados de ${filename}`);
  }
};

const processScoreFrequency = (data: ScoreData[], scoreField: 'FT_Score' | 'HT_Score'): ScoreFrequency[] => {
  console.log(`Processing score frequency for field: ${scoreField}`);
  console.log('Sample data:', data.slice(0, 3));
  
  return data
    .filter(item => {
      const score = item[scoreField];
      const matches = item.Matches;
      const percentage = item.Percentage;
      
      return score && score.trim() && matches && percentage;
    })
    .map(item => {
      const score = item[scoreField] || '';
      const matchesStr = item.Matches || '0';
      const percentageStr = item.Percentage || '0';
      
      // Remove % symbol and convert to number
      const percentage = parseFloat(percentageStr.replace('%', '')) || 0;
      const count = parseInt(matchesStr) || 0;
      
      return {
        score: score.trim(),
        count,
        percentage: Math.round(percentage)
      };
    })
    .sort((a, b) => b.percentage - a.percentage);
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

  console.log('FT Frequency processed:', ftFrequency.slice(0, 5));
  console.log('HT Frequency processed:', htFrequency.slice(0, 5));

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
