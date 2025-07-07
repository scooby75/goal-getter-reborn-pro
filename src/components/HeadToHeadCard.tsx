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
    const [home, away] = parts;
    return `${home.trim()} - ${away.trim()}`;
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
            {sortedMatches.map((match, index) => (
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
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
