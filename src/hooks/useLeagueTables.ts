import { useEffect, useState } from 'react';
import Papa from 'papaparse';

interface LeagueTableData {
  Ranking: string;
  Team_Home: string;
  GD: string;
  GP: string;
  W: string;
  D: string;
  L: string;
  GF: string;
  GA: string;
  Pts: string;
  Liga: string;
}

export const useLeagueTables = () => {
  const [homeData, setHomeData] = useState<LeagueTableData[]>([]);
  const [awayData, setAwayData] = useState<LeagueTableData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // 1. Carrega dados para times mandantes
        const [homeResult, awayResult] = await Promise.all([
          fetchAndParseCSV('/Data/tabela_ligas_home.csv'),
          fetchAndParseCSV('/Data/tabela_ligas_away.csv')
        ]);

        setHomeData(homeResult);
        setAwayData(awayResult);

      } catch (error) {
        console.error('Error loading league tables:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchAndParseCSV = async (url: string): Promise<LeagueTableData[]> => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load data from ${url}`);
      }
      
      const text = await response.text();
      const result = Papa.parse<LeagueTableData>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: header => {
          // Normaliza os cabeçalhos para garantir compatibilidade
          const headersMap: Record<string, string> = {
            'Femtine': 'Ranking',
            'SC': 'GD',
            // Adicione outros mapeamentos se necessário
          };
          return headersMap[header] || header.trim();
        },
        transform: value => value.trim(),
        dynamicTyping: true
      });

      if (result.errors.length > 0) {
        console.warn(`CSV parsing warnings for ${url}:`, result.errors);
      }

      // Validação básica dos dados
      if (!result.data || result.data.length === 0) {
        console.warn(`No data found in ${url}`);
      }

      return result.data;
    };

    fetchData();
  }, []);

  // Adiciona logs para depuração
  useEffect(() => {
    if (!isLoading) {
      console.log('Home data loaded:', homeData.slice(0, 3));
      console.log('Away data loaded:', awayData.slice(0, 3));
    }
  }, [isLoading, homeData, awayData]);

  return { 
    homeData, 
    awayData, 
    isLoading, 
    error 
  };
};
