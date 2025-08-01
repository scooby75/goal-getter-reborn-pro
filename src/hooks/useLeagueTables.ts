import { useEffect, useState } from 'react';
import Papa from 'papaparse';

interface LeagueTableData {
  Ranking: string;
  Team_Home: string;
  GD: string;
  GP?: string;
  W?: string;
  D?: string;
  L?: string;
  GF?: string;
  GA?: string;
  Pts?: string;
  Liga?: string;
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
        // Carrega dados para times mandantes
        const homeResponse = await fetch('/Data/tabela_ligas_home.csv');
        if (!homeResponse.ok) {
          throw new Error('Failed to load home team data');
        }
        const homeText = await homeResponse.text();
        
        const homeParsed = Papa.parse<LeagueTableData>(homeText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: header => header.trim(),
          transform: value => value.trim()
        });

        if (homeParsed.errors.length > 0) {
          console.warn('Home CSV parsing warnings:', homeParsed.errors);
        }

        setHomeData(homeParsed.data);

        // Carrega dados para times visitantes
        const awayResponse = await fetch('/Data/tabela_ligas_away.csv');
        if (!awayResponse.ok) {
          throw new Error('Failed to load away team data');
        }
        const awayText = await awayResponse.text();
        
        const awayParsed = Papa.parse<LeagueTableData>(awayText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: header => header.trim(),
          transform: value => value.trim()
        });

        if (awayParsed.errors.length > 0) {
          console.warn('Away CSV parsing warnings:', awayParsed.errors);
        }

        setAwayData(awayParsed.data);
      } catch (error) {
        console.error('Error loading league tables:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return { homeData, awayData, isLoading, error };
};
