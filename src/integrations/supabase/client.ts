import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = 'https://wztkwwqacqpfwrlslfis.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6dGt3d3FhY3FwZndybHNsZmlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MjM3NDYsImV4cCI6MjA2NTE5OTc0Nn0.Tm1z_7s99IexAur5mONZ4oEnbiG8ZhaV4EnX5SxQQvs';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});