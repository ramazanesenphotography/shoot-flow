import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bvvkulcsmidbvvouthey.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_rxVMJPfJQcHrUha4wEMCgg_dtBRGInm';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
