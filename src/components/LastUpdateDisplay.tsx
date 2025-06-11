
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { UpdateLog } from '@/types/auth';

export const LastUpdateDisplay = () => {
  const [lastUpdate, setLastUpdate] = useState<UpdateLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLastUpdate();
  }, []);

  const fetchLastUpdate = async () => {
    try {
      const { data, error } = await supabase
        .from('update_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching last update:', error);
        return;
      }

      setLastUpdate(data);
    } catch (error) {
      console.error('Error fetching last update:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-gray-600">Loading update status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!lastUpdate) {
    return (
      <Card className="mb-6 border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-yellow-600 mr-2" />
            <span className="text-sm text-yellow-800">No update records found</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'text-green-800 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-800 bg-red-50 border-red-200';
      case 'running':
        return 'text-blue-800 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-800 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      timeZone: 'America/Recife',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className={`mb-6 ${getStatusColor(lastUpdate.status)}`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            <div>
              <span className="text-sm font-medium">
                Last Update: {formatDate(lastUpdate.started_at)}
              </span>
              <div className="text-xs opacity-75">
                Status: {lastUpdate.status}
                {lastUpdate.message && ` - ${lastUpdate.message}`}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
