// auth.js — cliente Supabase centralizado
// Rellena `SUPABASE_URL` y `SUPABASE_ANON_KEY` con tus credenciales.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

export const SUPABASE_URL = 'https://wraogfketbdpfmrpfwfb.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_vcJNXS9cC2QaRMlLgoXs3g_TqIokq4d';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper para crear y suscribir un canal de broadcast
export function makeChannel(name = 'expo-room'){
  const ch = supabase.channel(name);
  ch.subscribe().catch(err => console.warn('Supabase channel subscribe error', err));
  return ch;
}
