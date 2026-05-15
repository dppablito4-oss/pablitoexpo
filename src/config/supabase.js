import { createClient } from '@supabase/supabase-js';

// Las credenciales vienen de variables de entorno (.env.local en desarrollo, Vercel en producción).
// La anon key es pública por diseño — la seguridad real viene de las políticas RLS.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('⚠️ Faltan las variables de entorno VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. Revisa tu archivo .env.local');
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '');
