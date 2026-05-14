/**
 * useIsAdmin.js — Hook para verificar si el usuario actual es admin.
 *
 * Unifica la lógica que antes estaba hardcodeada por email en Dashboard
 * y duplicada en AdminRoute. Ahora ambos usan este hook.
 */
import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

// Email del superadmin hardcodeado como fallback rápido
const SUPERADMIN_EMAIL = 'pabloclsa87@gmail.com';

export default function useIsAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsAdmin(false);
      setChecking(false);
      return;
    }

    // 1. Fast path: hardcoded superadmin
    if (user.email === SUPERADMIN_EMAIL) {
      setIsAdmin(true);
      setChecking(false);
      return;
    }

    // 2. DB check for role-based admins
    const check = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        setIsAdmin(!error && data?.role === 'superadmin');
      } catch {
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    };
    check();
  }, [user, authLoading]);

  return { isAdmin, checking };
}
