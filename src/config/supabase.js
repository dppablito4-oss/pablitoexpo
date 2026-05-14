import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '⚠️ Faltan variables de entorno de Supabase.\n' +
    'Crea un archivo .env.local en la raíz con:\n' +
    '  VITE_SUPABASE_URL=https://tu-proyecto.supabase.co\n' +
    '  VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui'
  );
}

export const supabase = createClient(
  SUPABASE_URL || '',
  SUPABASE_ANON_KEY || ''
);
