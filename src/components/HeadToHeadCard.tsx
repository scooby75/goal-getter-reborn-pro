import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useHeadToHead } from '@/hooks/useHeadToHead';
import { Calendar } from 'lucide-react';

interface HeadToHeadCardProps {
  homeTeam: string;
  awayTeam: string;
}

export const HeadToHeadCard: React.FC<HeadToHeadCardProps> = ({ homeTeam, awayTeam }) => {
  const { data: matches, isLoading, isError } = useHeadToHead(homeTeam, awayTeam);

  if (!homeTeam || !awayTeam) return null;

  const parseDate = (dateStr: string): number => {
    const parts = dateStr.includes('/')
      ? dateStr.split('/')
      : dateStr.split('-');

    const iso = parts.length === 3
      ? (dateStr.includes('/') ? `${parts[2]}-${parts[1]}-${parts[0]}` : dateStr)
      : '';

    return new Date(iso).getTime();
  };

  const formatDate = (dateStr: string): string => {
    const parts = dateStr.includes('/')
      ? dateStr.split('/')
      : dateStr.split('-');

    if (parts.length === 3) {
      return dateStr.includes('-')
        ? `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`
        : `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
    }

    return dateStr;
  };

  const formatScore = (score: string): { home: string; away: string } | null => {
    if (!score) return null;
    const parts = score.trim().split(/\s*-\s*/);
    if (parts.length !== 2) return null;
    return { home: parts[0].trim(), away: parts[1].trim() };
  };

  const getResult = (match: any, teamToCheck: string): string => {
    const score = formatScore(match.Score);
    if (!score) return '';

    const homeGoals = parseInt(score.home);
    const awayGoals = parseInt(score.away);

    if (isNaN(homeGoals) || isNaN(awayGoals)) return '';

    if (match.Team_Home.toLowerCase() === teamToCheck.toLowerCase()) {
      if (homeGoals > awayGoals) return 'V';
      if (homeGoals < awayGoals) return 'D';
      return 'E';
    }

    if (match.Team_Away.toLowerCase() === teamToCheck.toLowerCase()) {
      if (awayGoals > homeGoals) return 'V';
      if (awayGoals < homeGoals) return 'D';
      return 'E';
    }

    return '';
  };

  const sortedMatches = (matches || []).sort((a, b) => parseDate(b.Date) - parseDate(a.Date));

  return (
    <Card className="bg-white/90 shadow-md">
      <CardHeader>
        <CardTitle className="text-center text-lg">
          Confrontos Diretos ({homeTeam} x {awayTeam})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-sm text-blue-600">Carregando confrontos...</p>
        ) : isError ? (
          <p className="text-center text-sm text-red-600">Erro ao carregar confrontos.</p>
        ) : sortedMatches.length === 0 ? (
          <p className="text-center text-sm text-gray-500">Não existe partidas entre as equipes.</p>
        ) : (
          <div className="space-y-3">
            {sortedMatches.map((match, index) => {
              const score = formatScore(match.Score);
              const htScore = formatScore(match['HT Score']);
              const result = getResult(match, homeTeam);

              return (
                <div key={index} className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-1 text-gray-600 text-xs">
                      <Calendar className="w-4 h-4" />
                      {formatDate(match.Date)}
                    </div>
                    <div className="text-xs text-gray-600">{match.League}</div>
                  </div>

                  <div className="text-sm font-semibold text-gray-800">
                    {match.Team_Home} vs {match.Team_Away}
                  </div>

                  {score && (
                    <div className="text-xs mt-1 text-gray-700 font-medium">
                      FT: {score.home} - {score.away}
                    </div>
                  )}

                  {htScore && htScore.home !== '0' && htScore.away !== '0' && (
                    <div className="text-xs text-gray-500 mt-1">HT: {htScore.home} - {htScore.away}</div>
                  )}

                  {result && (
                    <div className={`mt-1 text-xs font-bold inline-block px-2 py-1 rounded border
                      ${result === 'V' ? 'text-green-600 bg-green-50 border-green-200' :
                        result === 'D' ? 'text-red-600 bg-red-50 border-red-200' :
                          'text-yellow-600 bg-yellow-50 border-yellow-200'}`}>
                      {result}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
