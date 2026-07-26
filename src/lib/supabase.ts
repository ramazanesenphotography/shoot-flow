import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bvvkulcsmidbvvouthey.supabase.co';
const supabaseAnonKey = 'sb_publishable_rxVMJPfJQcHrUha4wEMCgg_dtBRGInm';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
