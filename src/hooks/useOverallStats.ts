import { useQuery } from '@tanstack/react-query';
import { TeamStats } from '@/types/goalStats';
import { parseCSV } from '@/utils/csvParsers';

// Configurações otimizadas
const QUERY_CONFIG = {
  retry: 3, // Aumentado para 3 tentativas
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
  staleTime: 24 * 60 * 60 * 1000, // 24 horas
  gcTime: 48 * 60 * 60 * 1000, // 48 horas
} as const;

// Função de fetch com tratamento de erro completo
const fetchStatsData = async (): Promise<TeamStats[]> => {
  try {
    // URL corrigida com fallback
    const CSV_URL = process.env.NODE_ENV === 'development'
      ? '/data/Goals_Stats_Overall.csv' // Fallback local em desenvolvimento
      : 'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/Goals_Stats_Overall.csv';

    const response = await fetch(CSV_URL, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    // Verificações de status
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csvText = await response.text();

    // Validação do conteúdo
    if (!csvText.trim()) {
      throw new Error('O arquivo CSV está vazio');
    }

    // Parsing com validação
    const parsedData = parseCSV(csvText);
    
    if (!Array.isArray(parsedData)) {
      throw new Error('Formato inválido dos dados');
    }

    return parsedData;

  } catch (error) {
    console.error('Erro detalhado:', {
      error: error instanceof Error ? error.message : error,
      timestamp: new Date().toISOString(),
      url: CSV_URL
    });
    
    throw new Error(`Não foi possível carregar as estatísticas. Tente novamente mais tarde.`);
  }
};

export const useOverallStats = () => {
  const query = useQuery<TeamStats[], Error>({
    queryKey: ['overallStats'],
    queryFn: fetchStatsData,
    ...QUERY_CONFIG,
    onError: (error) => {
      // Log adicional para monitoramento
      console.error('Erro na query:', {
        message: error.message,
        stack: error.stack,
        date: new Date().toLocaleString()
      });
    }
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
    status: query.status
  };
};
