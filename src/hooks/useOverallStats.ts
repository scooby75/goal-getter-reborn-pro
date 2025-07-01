import { useQuery } from '@tanstack/react-query';
import { TeamStats } from '@/types/goalStats';
import { parseCSV } from '@/utils/csvParsers';

// 1. Defina a URL fora da função para evitar problemas de escopo
const CSV_URL = process.env.NODE_ENV === 'development'
  ? '/data/Goals_Stats_Overall.csv'
  : 'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/Goals_Stats_Overall.csv';

const QUERY_CONFIG = {
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
  staleTime: 24 * 60 * 60 * 1000,
  gcTime: 48 * 60 * 60 * 1000,
} as const;

const fetchStatsData = async (): Promise<TeamStats[]> => {
  try {
    const response = await fetch(CSV_URL, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
    }

    const csvText = await response.text();

    if (!csvText.trim()) {
      throw new Error('Arquivo CSV vazio ou inválido');
    }

    const parsedData = parseCSV(csvText);
    
    if (!Array.isArray(parsedData)) {
      throw new Error('Estrutura de dados inválida');
    }

    // Validação adicional dos campos obrigatórios
    const isValid = parsedData.every(item => 
      item.Team && typeof item.Goals === 'number'
    );
    
    if (!isValid) {
      throw new Error('Dados incompletos no CSV');
    }

    return parsedData;

  } catch (error) {
    console.error('Falha ao carregar estatísticas:', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      url: CSV_URL,
      timestamp: new Date().toISOString()
    });
    
    throw new Error('Falha ao carregar dados. Por favor, tente recarregar a página.');
  }
};

export const useOverallStats = () => {
  const query = useQuery<TeamStats[], Error>({
    queryKey: ['overallStats'],
    queryFn: fetchStatsData,
    ...QUERY_CONFIG,
    onError: (error) => {
      // Aqui você pode adicionar integração com serviço de monitoramento
      console.error('Erro na query de estatísticas:', {
        message: error.message,
        stack: error.stack?.split('\n')[0], // Apenas a primeira linha do stack
        time: new Date().toLocaleTimeString()
      });
    }
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isFetching && !query.isLoading,
    lastUpdated: query.dataUpdatedAt
  };
};
