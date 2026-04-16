import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wraogfketbdpfmrpfwfb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_vcJNXS9cC2QaRMlLgoXs3g_TqIokq4d';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
