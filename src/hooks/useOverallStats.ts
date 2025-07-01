import { useQuery } from '@tanstack/react-query';
import { TeamStats } from '@/types/goalStats';
import { fetchCSVWithRetry } from '@/utils/csvHelpers';
import { parseCSV } from '@/utils/csvParsers';

// Configurações constantes para a query
const DEFAULT_QUERY_CONFIG = {
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  staleTime: 60 * 60 * 1000, // 1 hora (dados estatísticos mudam pouco)
  gcTime: 24 * 60 * 60 * 1000, // 24 horas
} as const;

// URL com tipagem constante
const CSV_URL = 'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/Goals_Stats_Overall.csv' as const;

// Função de fetch com tratamento robusto de erros
const fetchOverallStats = async (): Promise<TeamStats[]> => {
  try {
    // 1. Fetch dos dados com retry
    const csvText = await fetchCSVWithRetry(CSV_URL);
    
    // 2. Validação do conteúdo
    if (!csvText?.trim()) {
      throw new Error('Conteúdo CSV vazio ou não carregado');
    }
    
    // 3. Parsing dos dados
    const parsedData = parseCSV(csvText);
    
    // 4. Validação da estrutura
    if (!Array.isArray(parsedData)) {
      throw new Error('Formato inválido dos dados parseados');
    }
    
    return parsedData;
  } catch (error) {
    console.error('Erro ao carregar estatísticas gerais:', {
      error,
      url: CSV_URL,
      timestamp: new Date().toISOString()
    });
    
    throw new Error(
      `Falha ao carregar estatísticas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
};

export const useOverallStats = () => {
  const query = useQuery<TeamStats[], Error>({
    queryKey: ['overallStats'],
    queryFn: fetchOverallStats,
    ...DEFAULT_QUERY_CONFIG,
    onError: (error) => {
      console.error('Erro na query de estatísticas gerais:', error.message);
    }
  });

  // Retorno padronizado com todos os estados úteis
  return {
    data: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
    isError: query.isError,
    status: query.status
  };
};
