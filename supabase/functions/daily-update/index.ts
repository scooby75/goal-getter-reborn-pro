
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Daily update function triggered');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Log start of update
    const { error: logError } = await supabase
      .from('update_logs')
      .insert({
        status: 'running',
        message: 'Daily data update process started',
        started_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Error logging start:', logError);
    }

    // Simulate data processing (replace with actual logic later)
    // This is where you would:
    // 1. Download/generate new CSV files
    // 2. Process the data
    // 3. Update your data storage
    
    console.log('Processing data update...');
    
    // For now, we'll simulate a successful update
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Log completion
    const { error: completeError } = await supabase
      .from('update_logs')
      .insert({
        status: 'success',
        message: 'Daily data update completed successfully',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      });

    if (completeError) {
      console.error('Error logging completion:', completeError);
    }

    console.log('Daily update completed successfully');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Daily update completed successfully',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in daily update:', error);
    
    // Log error
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabase
        .from('update_logs')
        .insert({
          status: 'error',
          message: 'Daily data update failed',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          error_details: error.message
        });
    } catch (logError) {
      console.error('Error logging failure:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
