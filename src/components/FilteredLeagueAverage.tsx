
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamStats } from '@/types/goalStats';

interface FilteredLeagueAverageProps {
  homeStats?: TeamStats;
  awayStats?: TeamStats;
  selectedHomeTeam: string;
  selectedAwayTeam: string;
}

export const FilteredLeagueAverage: React.FC<FilteredLeagueAverageProps> = ({
  homeStats,
  awayStats,
  selectedHomeTeam,
  selectedAwayTeam,
}) => {
  const calculateFilteredAverage = () => {
    const teams = [];
    if (homeStats) teams.push(homeStats);
    if (awayStats) teams.push(awayStats);
    
    if (teams.length === 0) return null;
    
    const avgGP = teams.reduce((sum, team) => sum + (team.GP || 0), 0) / teams.length;
    const avgTotal = teams.reduce((sum, team) => sum + (team.Avg || 0), 0) / teams.length;
    const avg05 = teams.reduce((sum, team) => sum + (team["0.5+"] || 0), 0) / teams.length;
    const avg15 = teams.reduce((sum, team) => sum + team["1.5+"], 0) / teams.length;
    const avg25 = teams.reduce((sum, team) => sum + team["2.5+"], 0) / teams.length;
    const avg35 = teams.reduce((sum, team) => sum + team["3.5+"], 0) / teams.length;
    const avg45 = teams.reduce((sum, team) => sum + team["4.5+"], 0) / teams.length;
    const avg55 = teams.reduce((sum, team) => sum + (team["5.5+"] || 0), 0) / teams.length;
    
    return {
      GP: Math.round(avgGP),
      Avg: Math.round(avgTotal * 100) / 100,
      "0.5+": Math.round(avg05 * 100) / 100,
      "1.5+": Math.round(avg15 * 100) / 100,
      "2.5+": Math.round(avg25 * 100) / 100,
      "3.5+": Math.round(avg35 * 100) / 100,
      "4.5+": Math.round(avg45 * 100) / 100,
      "5.5+": Math.round(avg55 * 100) / 100,
    };
  };

  const filteredAverage = calculateFilteredAverage();
  
  if (!filteredAverage) return null;

  const getTitle = () => {
    if (selectedHomeTeam && selectedAwayTeam) {
      return `Média dos Times Selecionados`;
    } else if (selectedHomeTeam) {
      return `Média do ${selectedHomeTeam}`;
    } else if (selectedAwayTeam) {
      return `Média do ${selectedAwayTeam}`;
    }
    return 'Média Filtrada';
  };

  return (
    <Card className="shadow-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white">
      <CardHeader>
        <CardTitle className="text-center text-xl">
          🎯 {getTitle()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="grid grid-cols-8 gap-4 text-center font-semibold">
              <div>
                <div className="text-sm opacity-90 mb-1">GP</div>
                <div className="text-lg">{filteredAverage.GP}</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">Avg</div>
                <div className="text-lg">{filteredAverage.Avg}</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">0.5+</div>
                <div className="text-lg">{filteredAverage["0.5+"]}%</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">1.5+</div>
                <div className="text-lg">{filteredAverage["1.5+"]}%</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">2.5+</div>
                <div className="text-lg">{filteredAverage["2.5+"]}%</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">3.5+</div>
                <div className="text-lg">{filteredAverage["3.5+"]}%</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">4.5+</div>
                <div className="text-lg">{filteredAverage["4.5+"]}%</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">5.5+</div>
                <div className="text-lg">{filteredAverage["5.5+"]}%</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile Cards */}
        <div className="block md:hidden space-y-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-sm opacity-90">GP</div>
              <div className="text-xl font-bold">{filteredAverage.GP}</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-sm opacity-90">Avg</div>
              <div className="text-xl font-bold">{filteredAverage.Avg}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-xs opacity-90">0.5+</div>
              <div className="text-lg font-bold">{filteredAverage["0.5+"]}%</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-xs opacity-90">1.5+</div>
              <div className="text-lg font-bold">{filteredAverage["1.5+"]}%</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-xs opacity-90">2.5+</div>
              <div className="text-lg font-bold">{filteredAverage["2.5+"]}%</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-xs opacity-90">3.5+</div>
              <div className="text-lg font-bold">{filteredAverage["3.5+"]}%</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-xs opacity-90">4.5+</div>
              <div className="text-lg font-bold">{filteredAverage["4.5+"]}%</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-xs opacity-90">5.5+</div>
              <div className="text-lg font-bold">{filteredAverage["5.5+"]}%</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
