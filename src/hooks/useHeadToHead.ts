import { useQuery } from '@tanstack/react-query';
import { fetchCSVWithRetry } from '@/utils/csvHelpers';
import { parseHeadToHeadCSV, HeadToHeadMatch } from '@/utils/csvParsers';


export const useHeadToHead = (team1?: string, team2?: string) => {
  return useQuery<HeadToHeadMatch[]>({
    queryKey: ['headToHead', team1, team2],
    queryFn: async () => {
      // ✅ Passe apenas uma URL como string
      const csvText = await fetchCSVWithRetry(
        'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/public/Data/all_leagues_results.csv'
      );

      const allMatches = parseHeadToHeadCSV(csvText);

      if (team1 && team2) {
        const filtered = allMatches.filter(match => {
          const h = match.Team_Home.toLowerCase();
          const a = match.Team_Away.toLowerCase();
          const t1 = team1.toLowerCase();
          const t2 = team2.toLowerCase();

          return (
            (h === t1 && a === t2) ||
            (h === t2 && a === t1) ||
            (h.includes(t1) && a.includes(t2)) ||
            (h.includes(t2) && a.includes(t1))
          );
        });

        return filtered.sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
      }

      return allMatches;
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
    enabled: true,
  });
};
