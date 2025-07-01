import { useQuery } from '@tanstack/react-query';
import { LeagueAverageData } from '@/types/goalStats';
import { fetchCSVWithRetry } from '@/utils/csvHelpers';
import { parseLeagueAveragesCSV } from '@/utils/csvParsers';

// Configurações constantes para a query
const QUERY_CONFIG = {
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  staleTime: 24 * 60 * 60 * 1000, // 24 horas de cache
  gcTime: 48 * 60 * 60 * 1000, // 48 horas de garbage collection
} as const;

// URL com tipagem constante
const CSV_URL = 'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/League_Averages.csv' as const;

// Função de fetch com tratamento completo de erros e validação
const fetchLeagueData = async (): Promise<LeagueAverageData[]> => {
  try {
    // 1. Fetch dos dados com retry
    const csvText = await fetchCSVWithRetry(CSV_URL);
    
    // 2. Validação básica do conteúdo
    if (!csvText?.trim()) {
      throw new Error('O arquivo CSV está vazio ou não foi carregado corretamente');
    }
    
    // 3. Parsing dos dados
    const parsedData = parseLeagueAveragesCSV(csvText);
    
    // 4. Validação da estrutura dos dados
    if (!Array.isArray(parsedData) {
      throw new Error('Os dados parseados não estão no formato esperado');
    }
    
    // 5. Validação adicional se necessário
    if (parsedData.length === 0) {
      console.warn('O arquivo CSV foi carregado mas está vazio');
    }
    
    return parsedData;
  } catch (error) {
    console.error('Erro ao carregar médias da liga:', error);
    throw new Error(
      `Falha ao processar médias da liga: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
};

export const useLeagueAverages = () => {
  const query = useQuery<LeagueAverageData[], Error>({
    queryKey: ['leagueAverages'],
    queryFn: fetchLeagueData,
    ...QUERY_CONFIG,
    onError: (error) => {
      console.error('Erro na query de médias da liga:', {
        error: error.message,
        url: CSV_URL,
        timestamp: new Date().toISOString()
      });
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
