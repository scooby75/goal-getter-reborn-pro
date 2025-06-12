
-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar função para executar a atualização dos dados
CREATE OR REPLACE FUNCTION public.trigger_data_update()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Inserir log de início da atualização
  INSERT INTO public.update_logs (status, message, started_at)
  VALUES ('running', 'Daily update started', NOW());
  
  -- A edge function será chamada via HTTP
  -- O resto da lógica será implementada na edge function
END;
$$;

-- Agendar a execução diária às 05:00 horário de Recife (UTC-3, então 08:00 UTC)
SELECT cron.schedule(
  'daily-data-update',
  '0 8 * * *', -- 08:00 UTC = 05:00 Recife time
  $$
  SELECT
    net.http_post(
        url:='https://wztkwwqacqpfwrlslfis.supabase.co/functions/v1/daily-update',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6dGt3d3FhY3FwZndybHNsZmlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MjM3NDYsImV4cCI6MjA2NTE5OTc0Nn0.Tm1z_7s99IexAur5mONZ4oEnbiG8ZhaV4EnX5SxQQvs"}'::jsonb,
        body:='{"trigger": "cron", "timezone": "America/Recife"}'::jsonb
    ) as request_id;
  $$
);

-- Função para listar cron jobs (útil para debug)
CREATE OR REPLACE FUNCTION public.list_cron_jobs()
RETURNS TABLE (
  jobid bigint,
  schedule text,
  command text,
  nodename text,
  nodeport integer,
  database text,
  username text,
  active boolean,
  jobname text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM cron.job;
$$;
