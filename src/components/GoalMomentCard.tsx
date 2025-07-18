
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { GoalMomentStats } from '@/types/goalStats';

interface GoalMomentCardProps {
  homeTeam: string;
  awayTeam: string;
  homeGoalMoments?: GoalMomentStats;
  awayGoalMoments?: GoalMomentStats;
}

export const GoalMomentCard: React.FC<GoalMomentCardProps> = ({
  homeTeam,
  awayTeam,
  homeGoalMoments,
  awayGoalMoments
}) => {
  const timeSlots = [
    { key: '0-15', label: '0-15 min' },
    { key: '16-30', label: '16-30 min' },
    { key: '31-45', label: '31-45 min' },
    { key: '46-60', label: '46-60 min' },
    { key: '61-75', label: '61-75 min' },
    { key: '76-90', label: '76-90 min' }
  ];

  if (!homeGoalMoments && !awayGoalMoments) {
    return null;
  }

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-xl">
      <CardHeader>
        <CardTitle className="text-center text-2xl text-gray-800 flex items-center justify-center gap-2">
          <Clock className="h-6 w-6 text-blue-600" />
          Momento dos Gols
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Gols Marcados */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-center text-green-700">
              ⚽ Gols Marcados
            </h3>
            
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-green-50 border-b border-gray-200">
                    <th className="p-3 text-left font-semibold text-gray-800">Time</th>
                    {timeSlots.map(slot => (
                      <th key={slot.key} className="p-3 text-center font-semibold text-gray-800">
                        {slot.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {homeGoalMoments && (
                    <tr className="hover:bg-gray-50 border-b border-gray-100">
                      <td className="p-3 font-medium text-gray-800">{homeTeam} (Casa)</td>
                      {timeSlots.map(slot => (
                        <td key={slot.key} className="p-3 text-center text-gray-800">
                          {homeGoalMoments[`${slot.key}_mar` as keyof GoalMomentStats] || 0}
                        </td>
                      ))}
                    </tr>
                  )}
                  {awayGoalMoments && (
                    <tr className="hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-800">{awayTeam} (Fora)</td>
                      {timeSlots.map(slot => (
                        <td key={slot.key} className="p-3 text-center text-gray-800">
                          {awayGoalMoments[`${slot.key}_mar` as keyof GoalMomentStats] || 0}
                        </td>
                      ))}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="block md:hidden space-y-4">
              {homeGoalMoments && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 text-gray-800">{homeTeam} (Casa)</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map(slot => (
                      <div key={slot.key} className="bg-white border border-gray-200 rounded p-2 text-center">
                        <div className="text-xs text-gray-600">{slot.label}</div>
                        <div className="text-lg font-bold text-gray-800">
                          {homeGoalMoments[`${slot.key}_mar` as keyof GoalMomentStats] || 0}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {awayGoalMoments && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 text-gray-800">{awayTeam} (Fora)</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map(slot => (
                      <div key={slot.key} className="bg-white border border-gray-200 rounded p-2 text-center">
                        <div className="text-xs text-gray-600">{slot.label}</div>
                        <div className="text-lg font-bold text-gray-800">
                          {awayGoalMoments[`${slot.key}_mar` as keyof GoalMomentStats] || 0}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Gols Sofridos */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-center text-red-700">
              🥅 Gols Sofridos 
            </h3>
            
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-red-50 border-b border-gray-200">
                    <th className="p-3 text-left font-semibold text-gray-800">Time</th>
                    {timeSlots.map(slot => (
                      <th key={slot.key} className="p-3 text-center font-semibold text-gray-800">
                        {slot.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {homeGoalMoments && (
                    <tr className="hover:bg-gray-50 border-b border-gray-100">
                      <td className="p-3 font-medium text-gray-800">{homeTeam} (Casa)</td>
                      {timeSlots.map(slot => (
                        <td key={slot.key} className="p-3 text-center text-gray-800">
                          {homeGoalMoments[`${slot.key}_sofri` as keyof GoalMomentStats] || 0}
                        </td>
                      ))}
                    </tr>
                  )}
                  {awayGoalMoments && (
                    <tr className="hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-800">{awayTeam} (Fora)</td>
                      {timeSlots.map(slot => (
                        <td key={slot.key} className="p-3 text-center text-gray-800">
                          {awayGoalMoments[`${slot.key}_sofri` as keyof GoalMomentStats] || 0}
                        </td>
                      ))}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="block md:hidden space-y-4">
              {homeGoalMoments && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 text-gray-800">{homeTeam} (Casa)</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map(slot => (
                      <div key={slot.key} className="bg-white border border-gray-200 rounded p-2 text-center">
                        <div className="text-xs text-gray-600">{slot.label}</div>
                        <div className="text-lg font-bold text-gray-800">
                          {homeGoalMoments[`${slot.key}_sofri` as keyof GoalMomentStats] || 0}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {awayGoalMoments && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 text-gray-800">{awayTeam} (Fora)</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map(slot => (
                      <div key={slot.key} className="bg-white border border-gray-200 rounded p-2 text-center">
                        <div className="text-xs text-gray-600">{slot.label}</div>
                        <div className="text-lg font-bold text-gray-800">
                          {awayGoalMoments[`${slot.key}_sofri` as keyof GoalMomentStats] || 0}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
