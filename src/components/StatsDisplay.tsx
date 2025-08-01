import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TeamStats, TableTeamData } from '@/types/goalStats';

interface StatsDisplayProps {
  homeTeam: string;
  awayTeam: string;
  homeStats?: TeamStats;
  awayStats?: TeamStats;
  homeTableData?: TableTeamData[];
  awayTableData?: TableTeamData[];
}

export const StatsDisplay: React.FC<StatsDisplayProps> = ({
  homeTeam,
  awayTeam,
  homeStats,
  awayStats,
  homeTableData = [],
  awayTableData = []
}) => {
  const statsToDisplay = [];
  
  // Process home team data
  if (homeStats && homeTeam) {
    const homeTableEntry = homeTableData.find(team => 
      team.Team_Home?.trim().toLowerCase() === homeTeam.trim().toLowerCase()
    );
    
    statsToDisplay.push({
      ...homeStats,
      Team: `${homeStats.Team} (Casa)`,
      type: 'home',
      ranking: homeTableEntry?.Ranking || '-',
      goalDifference: homeTableEntry?.GD || '-'
    });
  }
  
  // Process away team data
  if (awayStats && awayTeam) {
    const awayTableEntry = awayTableData.find(team => 
      team.Team_Home?.trim().toLowerCase() === awayTeam.trim().toLowerCase()
    );
    
    statsToDisplay.push({
      ...awayStats,
      Team: `${awayStats.Team} (Visitante)`,
      type: 'away',
      ranking: awayTableEntry?.Ranking || '-',
      goalDifference: awayTableEntry?.GD || '-'
    });
  }

  if (statsToDisplay.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-center text-2xl text-gray-800">
          📈 Estatísticas das Equipes Selecionadas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-bold text-gray-700">Equipe</TableHead>
                <TableHead className="font-bold text-gray-700 text-center">Ranking</TableHead>
                <TableHead className="font-bold text-gray-700 text-center">SG</TableHead>
                {/* Restante das colunas... */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {statsToDisplay.map((stats, index) => (
                <TableRow key={index}>
                  <TableCell>{stats.Team}</TableCell>
                  <TableCell className="text-center">{stats.ranking}</TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                      stats.goalDifference.toString().startsWith('+') 
                        ? 'bg-green-100 text-green-800' 
                        : stats.goalDifference.toString().startsWith('-')
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}>
                      {stats.goalDifference}
                    </span>
                  </TableCell>
                  {/* Restante das células... */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {/* Mobile version... */}
      </CardContent>
    </Card>
  );
};
