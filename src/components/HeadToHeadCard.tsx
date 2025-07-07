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

  const formatScore = (score: string): string => {
    if (!score) return '';
    const parts = score.trim().split(/\s*-\s*/);
    if (parts.length !== 2) return score;
    return `${parts[0]} - ${parts[1]}`;
  };

  const getMatchResult = (match: any, teamToCheck: string): string => {
    if (!match.Score || !match.Score.includes('-')) return '';

    try {
      const [homeScoreStr, awayScoreStr] = match.Score.trim().split(/\s*-\s*/);
      const homeScore = parseInt(homeScoreStr);
      const awayScore = parseInt(awayScoreStr);
      if (isNaN(homeScore) || isNaN(awayScore)) return '';

      if (match.Team_Home.toLowerCase().includes(teamToCheck.toLowerCase())) {
        if (homeScore > awayScore) return 'V';
        if (homeScore < awayScore) return 'D';
        return 'E';
      } else if (match.Team_Away.toLowerCase().includes(teamToCheck.toLowerCase())) {
        if (awayScore > homeScore) return 'V';
        if (awayScore < homeScore) return 'D';
        return 'E';
      }

      return '';
    } catch (e) {
      console.warn('Erro ao analisar resultado:', e);
      return '';
    }
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
              const result = getMatchResult(match, homeTeam);
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
                    {match.Team_Home} {formatScore(match.Score)} {match.Team_Away}
                  </div>
                  {match['HT Score'] && match['HT Score'] !== '0-0' && (
                    <div className="text-xs text-gray-500 mt-1">Intervalo: {formatScore(match['HT Score'])}</div>
                  )}
                  {result && (
                    <div className="mt-1 text-xs font-bold inline-block px-2 py-1 rounded border 
                      {result === 'V' ? 'text-green-600 bg-green-50 border-green-200' :
                       result === 'D' ? 'text-red-600 bg-red-50 border-red-200' :
                       result === 'E' ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
                       'text-gray-600 bg-gray-50 border-gray-200'}">
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
