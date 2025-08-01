import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TeamStats } from '@/types/goalStats';

interface TableTeamData {
  Team_Home: string;
  Ranking: string;
  GD: string;
  Pts?: string;
  Liga?: string;
}

interface StatsDisplayProps {
  homeTeam: string;
  awayTeam: string;
  homeStats?: TeamStats;
  awayStats?: TeamStats;
  homeTableData?: TableTeamData[];
  awayTableData?: TableTeamData[];
}

const formatRanking = (rank: string | null | undefined): string => {
  if (!rank) return '-';
  return rank.includes('°') ? rank : `${rank}°`;
};

export const StatsDisplay: React.FC<StatsDisplayProps> = ({
  homeTeam,
  awayTeam,
  homeStats,
  awayStats,
  homeTableData = [],
  awayTableData = []
}) => {
  const statsToDisplay = [];
  
  if (homeStats && homeTeam) {
    const homeTableEntry = homeTableData.find(team => 
      team.Team_Home?.trim().toLowerCase() === homeTeam.trim().toLowerCase()
    );
    
    statsToDisplay.push({
      ...homeStats,
      Team: `${homeStats.Team} (Casa)`,
      type: 'home',
      ranking: homeTableEntry?.Ranking || null,
      goalDifference: homeTableEntry?.GD || null
    });
  }
  
  if (awayStats && awayTeam) {
    const awayTableEntry = awayTableData.find(team => 
      team.Team_Home?.trim().toLowerCase() === awayTeam.trim().toLowerCase()
    );
    
    statsToDisplay.push({
      ...awayStats,
      Team: `${awayStats.Team} (Visitante)`,
      type: 'away',
      ranking: awayTableEntry?.Ranking || null,
      goalDifference: awayTableEntry?.GD || null
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
                <TableHead className="font-bold text-gray-700 text-center">GP</TableHead>
                <TableHead className="font-bold text-gray-700 text-center">Avg</TableHead>
                <TableHead className="font-bold text-gray-700 text-center">1.5+</TableHead>
                <TableHead className="font-bold text-gray-700 text-center">2.5+</TableHead>
                <TableHead className="font-bold text-gray-700 text-center">3.5+</TableHead>
                <TableHead className="font-bold text-gray-700 text-center">4.5+</TableHead>
                {statsToDisplay.some(s => s["1st half"] !== undefined) && (
                  <TableHead className="font-bold text-gray-700 text-center">Marcou 1ºT</TableHead>
                )}
                {statsToDisplay.some(s => s["2nd half"] !== undefined) && (
                  <TableHead className="font-bold text-gray-700 text-center">Marcou 2ºT</TableHead>
                )}
                {statsToDisplay.some(s => s["Avg. minute"] !== undefined) && (
                  <TableHead className="font-bold text-gray-700 text-center">1º Gol (min)</TableHead>
                )}
                {statsToDisplay.some(s => s.scoredFirstPerc !== undefined) && (
                  <TableHead className="font-bold text-gray-700 text-center">Marcou 1º</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {statsToDisplay.map((stats, index) => (
                <TableRow 
                  key={index} 
                  className={`hover:bg-gray-50 transition-colors ${
                    stats.type === 'home' ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-blue-500'
                  }`}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${
                        stats.type === 'home' ? 'bg-green-500' : 'bg-blue-500'
                      }`}></span>
                      {stats.Team}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    {formatRanking(stats.ranking)}
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                      !stats.goalDifference ? '' :
                      String(stats.goalDifference).startsWith('+') ? 'bg-green-100 text-green-800' :
                      parseInt(String(stats.goalDifference)) > 0 ? 'bg-green-100 text-green-800' :
                      parseInt(String(stats.goalDifference)) < 0 ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {stats.goalDifference || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-semibold">{stats.GP}</TableCell>
                  <TableCell className="text-center font-semibold">{stats.Avg?.toFixed(2) || '-'}</TableCell>
                  <TableCell className="text-center">
                    <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm font-medium">
                      {stats["1.5+"]}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                      {stats["2.5+"]}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-block bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium">
                      {stats["3.5+"]}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
                      {stats["4.5+"]}%
                    </span>
                  </TableCell>
                  {stats["1st half"] !== undefined && (
                    <TableCell className="text-center font-semibold">{stats["1st half"]}%</TableCell>
                  )}
                  {stats["2nd half"] !== undefined && (
                    <TableCell className="text-center font-semibold">{stats["2nd half"]}%</TableCell>
                  )}
                  {stats["Avg. minute"] !== undefined && (
                    <TableCell className="text-center font-semibold">{stats["Avg. minute"]}</TableCell>
                  )}
                  {stats.scoredFirstPerc !== undefined && (
                    <TableCell className="text-center font-semibold">{stats.scoredFirstPerc}%</TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Mobile Cards */}
        <div className="block md:hidden space-y-4">
          {statsToDisplay.map((stats, index) => (
            <Card key={index} className={`border-l-4 ${
              stats.type === 'home' ? 'border-l-green-500' : 'border-l-blue-500'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className={`w-3 h-3 rounded-full ${
                    stats.type === 'home' ? 'bg-green-500' : 'bg-blue-500'
                  }`}></span>
                  <h3 className="font-semibold text-gray-800">{stats.Team}</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm mb-4 pb-3 border-b">
                  <div className="text-center">
                    <div className="text-gray-600 text-xs">Ranking</div>
                    <div className="font-bold text-lg">{formatRanking(stats.ranking)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600 text-xs">Saldo de Gols</div>
                    <div className={`font-bold text-lg ${
                      !stats.goalDifference ? '' :
                      String(stats.goalDifference).startsWith('+') ? 'text-green-600' :
                      parseInt(String(stats.goalDifference)) > 0 ? 'text-green-600' :
                      parseInt(String(stats.goalDifference)) < 0 ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {stats.goalDifference || '-'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm mb-4">
                  <div className="text-center">
                    <div className="text-gray-600 text-xs">GP</div>
                    <div className="font-bold text-lg">{stats.GP}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600 text-xs">Avg</div>
                    <div className="font-bold text-lg">{stats.Avg?.toFixed(2) || '-'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600 text-xs">Total</div>
                    <div className="font-bold text-lg text-blue-600">
                      {stats.Avg ? (stats.GP * stats.Avg).toFixed(0) : '-'}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-center">
                    <div className="text-gray-600 text-xs">1.5+</div>
                    <div className="bg-yellow-100 text-yellow-800 px-2 py-2 rounded-full font-medium">
                      {stats["1.5+"]}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600 text-xs">2.5+</div>
                    <div className="bg-green-100 text-green-800 px-2 py-2 rounded-full font-medium">
                      {stats["2.5+"]}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600 text-xs">3.5+</div>
                    <div className="bg-orange-100 text-orange-800 px-2 py-2 rounded-full font-medium">
                      {stats["3.5+"]}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600 text-xs">4.5+</div>
                    <div className="bg-red-100 text-red-800 px-2 py-2 rounded-full font-medium">
                      {stats["4.5+"]}%
                    </div>
                  </div>
                </div>

                {(stats["1st half"] !== undefined || stats["2nd half"] !== undefined || 
                  stats["Avg. minute"] !== undefined || stats.scoredFirstPerc !== undefined) && (
                  <div className="mt-4 border-t pt-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      {stats["1st half"] !== undefined && (
                        <div className="text-center">
                          <div className="text-gray-600 text-xs">Marcou 1ºT</div>
                          <div className="bg-blue-100 text-blue-800 px-2 py-2 rounded-full font-medium">
                            {stats["1st half"]}%
                          </div>
                        </div>
                      )}
                      {stats["2nd half"] !== undefined && (
                        <div className="text-center">
                          <div className="text-gray-600 text-xs">Marcou 2ºT</div>
                          <div className="bg-blue-100 text-blue-800 px-2 py-2 rounded-full font-medium">
                            {stats["2nd half"]}%
                          </div>
                        </div>
                      )}
                      {stats["Avg. minute"] !== undefined && (
                        <div className="text-center">
                          <div className="text-gray-600 text-xs">1º Gol (min)</div>
                          <div className="font-bold text-lg mt-2">
                            {stats["Avg. minute"]}
                          </div>
                        </div>
                      )}
                      {stats.scoredFirstPerc !== undefined && (
                        <div className="text-center">
                          <div className="text-gray-600 text-xs">Marcou 1º</div>
                          <div className="bg-purple-100 text-purple-800 px-2 py-2 rounded-full font-medium">
                            {stats.scoredFirstPerc}%
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
