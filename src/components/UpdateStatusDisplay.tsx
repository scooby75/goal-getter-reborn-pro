
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, RefreshCw, CheckCircle, XCircle, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { UpdateLog } from '@/types/auth';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const UpdateStatusDisplay = () => {
  const [lastUpdate, setLastUpdate] = useState<UpdateLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchLastUpdate();
    
    // Set up real-time subscription for update logs
    const subscription = supabase
      .channel('update_logs_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'update_logs'
      }, () => {
        fetchLastUpdate();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchLastUpdate = async () => {
    try {
      const { data, error } = await supabase
        .from('update_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

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

  const triggerManualUpdate = async () => {
    if (!isAdmin()) {
      toast.error('Only administrators can trigger manual updates');
      return;
    }

    setTriggering(true);
    try {
      const { error } = await supabase.functions.invoke('daily-update', {
        body: { trigger: 'manual', timezone: 'America/Recife' }
      });

      if (error) {
        throw error;
      }

      toast.success('Manual update triggered successfully');
    } catch (error) {
      console.error('Error triggering manual update:', error);
      toast.error('Failed to trigger manual update');
    } finally {
      setTriggering(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

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
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-yellow-800">
            System Update Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800">No update records found</span>
            </div>
            {isAdmin() && (
              <Button 
                size="sm" 
                onClick={triggerManualUpdate}
                disabled={triggering}
                className="ml-4"
              >
                {triggering ? (
                  <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Play className="h-3 w-3 mr-1" />
                )}
                Trigger Update
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`mb-6 ${getStatusColor(lastUpdate.status)}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          System Update Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {getStatusIcon(lastUpdate.status)}
            <div className="ml-2">
              <div className="text-sm font-medium">
                Last Update: {formatDate(lastUpdate.started_at)}
              </div>
              <div className="text-xs opacity-75">
                Status: {lastUpdate.status}
                {lastUpdate.message && ` - ${lastUpdate.message}`}
              </div>
              {lastUpdate.error_details && (
                <div className="text-xs opacity-75 mt-1">
                  Error: {lastUpdate.error_details}
                </div>
              )}
            </div>
          </div>
          {isAdmin() && (
            <Button 
              size="sm" 
              onClick={triggerManualUpdate}
              disabled={triggering || lastUpdate.status === 'running'}
              className="ml-4"
            >
              {triggering ? (
                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Play className="h-3 w-3 mr-1" />
              )}
              Trigger Update
            </Button>
          )}
        </div>
        <div className="mt-2 text-xs opacity-60">
          Next scheduled update: Daily at 05:00 (Recife time)
        </div>
      </CardContent>
    </Card>
  );
};
