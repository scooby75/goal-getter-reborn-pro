
import { useQuery } from '@tanstack/react-query';
import Papa from 'papaparse';

export interface ScoreData {
  HT_Score: string;
  FT_Score: string;
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

const fetchScoreData = async (): Promise<ScoreData[]> => {
  try {
    const response = await fetch('/Data/full_time_scores.csv', {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csvText = await response.text();
    
    const result = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (!result.data) {
      throw new Error('Falha ao processar CSV');
    }

    return result.data as ScoreData[];
  } catch (error) {
    console.error('Erro ao carregar dados de placares:', error);
    throw new Error('Falha ao carregar dados de placares');
  }
};

const calculateFrequency = (scores: string[]): ScoreFrequency[] => {
  const frequency: Record<string, number> = {};
  
  scores.forEach(score => {
    if (score && score.trim()) {
      frequency[score] = (frequency[score] || 0) + 1;
    }
  });

  const total = scores.length;
  
  return Object.entries(frequency)
    .map(([score, count]) => ({
      score,
      count,
      percentage: Math.round((count / total) * 100)
    }))
    .sort((a, b) => b.count - a.count);
};

export const useScoreFrequency = () => {
  const query = useQuery<ScoreData[], Error>({
    queryKey: ['scoreFrequency'],
    queryFn: fetchScoreData,
    ...QUERY_CONFIG
  });

  const htFrequency = query.data ? 
    calculateFrequency(query.data.map(d => d.HT_Score).filter(Boolean)) : [];
  
  const ftFrequency = query.data ? 
    calculateFrequency(query.data.map(d => d.FT_Score).filter(Boolean)) : [];

  return {
    data: query.data || [],
    htFrequency,
    ftFrequency,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
};
