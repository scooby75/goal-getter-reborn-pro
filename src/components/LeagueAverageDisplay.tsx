
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamStats, LeagueAverageData } from '@/types/goalStats';

interface LeagueAverageDisplayProps {
  homeStats?: TeamStats;
  awayStats?: TeamStats;
  leagueAverages: LeagueAverageData[];
  selectedHomeTeam: string;
  selectedAwayTeam: string;
}

export const LeagueAverageDisplay: React.FC<LeagueAverageDisplayProps> = ({
  homeStats,
  awayStats,
  leagueAverages,
  selectedHomeTeam,
  selectedAwayTeam,
}) => {
  const extractLeagueFromTeamName = (teamName: string): string | null => {
    if (!teamName) return null;
    
    // Check if team name contains league identifier with " - "
    const parts = teamName.split(' - ');
    if (parts.length >= 2) {
      return parts[0].trim();
    }
    
    return null;
  };

  const findLeagueAverage = (): { league: LeagueAverageData | null, isDifferentLeagues: boolean } => {
    // If we have no teams selected, return null
    if (!selectedHomeTeam && !selectedAwayTeam) {
      return { league: null, isDifferentLeagues: false };
    }
    
    let homeLeague = null;
    let awayLeague = null;
    
    // Extract league from home team
    if (selectedHomeTeam) {
      const leagueName = extractLeagueFromTeamName(selectedHomeTeam);
      if (leagueName) {
        homeLeague = leagueAverages.find(la => 
          la.League_Name.toLowerCase() === leagueName.toLowerCase()
        );
        
        if (!homeLeague) {
          // Try partial match
          homeLeague = leagueAverages.find(la => 
            la.League_Name.toLowerCase().includes(leagueName.toLowerCase()) ||
            leagueName.toLowerCase().includes(la.League_Name.toLowerCase())
          );
        }
      }
    }
    
    // Extract league from away team
    if (selectedAwayTeam) {
      const leagueName = extractLeagueFromTeamName(selectedAwayTeam);
      if (leagueName) {
        awayLeague = leagueAverages.find(la => 
          la.League_Name.toLowerCase() === leagueName.toLowerCase()
        );
        
        if (!awayLeague) {
          // Try partial match
          awayLeague = leagueAverages.find(la => 
            la.League_Name.toLowerCase().includes(leagueName.toLowerCase()) ||
            leagueName.toLowerCase().includes(la.League_Name.toLowerCase())
          );
        }
      }
    }

    console.log('Home league found:', homeLeague?.League_Name);
    console.log('Away league found:', awayLeague?.League_Name);

    // Check if both teams are selected and from different leagues
    if (selectedHomeTeam && selectedAwayTeam && homeLeague && awayLeague) {
      if (homeLeague.League_Name !== awayLeague.League_Name) {
        return { league: null, isDifferentLeagues: true };
      }
      return { league: homeLeague, isDifferentLeagues: false };
    }
    
    // Return the league from either home or away team
    const foundLeague = homeLeague || awayLeague;
    return { league: foundLeague, isDifferentLeagues: false };
  };

  const { league: leagueAverage, isDifferentLeagues } = findLeagueAverage();
  
  // Show "Different Leagues" message if teams are from different leagues
  if (isDifferentLeagues) {
    return (
      <Card className="shadow-lg bg-gradient-to-r from-red-500 to-orange-500 text-white">
        <CardHeader>
          <CardTitle className="text-center text-xl">
            ⚠️ Ligas Diferentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="text-lg">Os times selecionados pertencem a ligas diferentes.</p>
            <p className="text-sm opacity-90 mt-2">
              Selecione times da mesma liga para ver a média da liga.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Don't show if no league average found
  if (!leagueAverage) return null;

  const getTitle = () => {
    if (selectedHomeTeam && selectedAwayTeam) {
      return `Média da Liga: ${leagueAverage.League_Name}`;
    } else if (selectedHomeTeam) {
      return `Média da Liga do ${selectedHomeTeam}`;
    } else if (selectedAwayTeam) {
      return `Média da Liga do ${selectedAwayTeam}`;
    }
    return `Média da Liga: ${leagueAverage.League_Name}`;
  };

  return (
    <Card className="shadow-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
      <CardHeader>
        <CardTitle className="text-center text-xl">
          🏆 {getTitle()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="grid grid-cols-8 gap-4 text-center font-semibold">
              <div>
                <div className="text-sm opacity-90 mb-1">0.5+</div>
                <div className="text-lg">{leagueAverage["0.5+"]}%</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">1.5+</div>
                <div className="text-lg">{leagueAverage["1.5+"]}%</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">2.5+</div>
                <div className="text-lg">{leagueAverage["2.5+"]}%</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">3.5+</div>
                <div className="text-lg">{leagueAverage["3.5+"]}%</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">4.5+</div>
                <div className="text-lg">{leagueAverage["4.5+"]}%</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">5.5+</div>
                <div className="text-lg">{leagueAverage["5.5+"]}%</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">BTS</div>
                <div className="text-lg">{leagueAverage.BTS}%</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">CS</div>
                <div className="text-lg">{leagueAverage.CS}%</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile Cards */}
        <div className="block md:hidden space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-xs opacity-90">0.5+</div>
              <div className="text-lg font-bold">{leagueAverage["0.5+"]}%</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-xs opacity-90">1.5+</div>
              <div className="text-lg font-bold">{leagueAverage["1.5+"]}%</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-xs opacity-90">2.5+</div>
              <div className="text-lg font-bold">{leagueAverage["2.5+"]}%</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-xs opacity-90">3.5+</div>
              <div className="text-lg font-bold">{leagueAverage["3.5+"]}%</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-xs opacity-90">4.5+</div>
              <div className="text-lg font-bold">{leagueAverage["4.5+"]}%</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-xs opacity-90">5.5+</div>
              <div className="text-lg font-bold">{leagueAverage["5.5+"]}%</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-xs opacity-90">BTS</div>
              <div className="text-lg font-bold">{leagueAverage.BTS}%</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-xs opacity-90">CS</div>
              <div className="text-lg font-bold">{leagueAverage.CS}%</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
