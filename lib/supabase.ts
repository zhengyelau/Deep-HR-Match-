import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bkbwybudhnxxxenzarxu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrYnd5YnVkaG54eHhlbnphcnh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MzQ2ODIsImV4cCI6MjA4MDIxMDY4Mn0.LxangqPwDInLR6ivJC3tbN3r2Y1twtc9AIhHPOG77bU';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
