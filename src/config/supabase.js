import { createClient } from '@supabase/supabase-js';

// Las variables de entorno tienen prioridad, pero incluimos fallbacks
// porque la anon key de Supabase es PÚBLICA por diseño (publishable).
// La seguridad real viene de las políticas RLS en la base de datos.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
  || 'https://wraogfketbdpfmrpfwfb.supabase.co';

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
  || 'sb_publishable_vcJNXS9cC2QaRMlLgoXs3g_TqIokq4d';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
