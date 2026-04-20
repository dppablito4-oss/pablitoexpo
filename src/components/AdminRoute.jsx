import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!loading && user) {
      checkAdminStatus();
    } else if (!loading && !user) {
      setChecking(false);
    }
  }, [user, loading]);

  const checkAdminStatus = async () => {
    // 1. Verificación rápida (hardcoded por seguridad y acceso inmediato)
    if (user.email === 'pabloclsa87@gmail.com') {
      setIsAdmin(true);
      setChecking(false);
      return;
    }

    // 2. Verificación en base de datos (por si luego asignas otros admins)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (!error && data?.role === 'superadmin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (e) {
      setIsAdmin(false);
    } finally {
      setChecking(false);
    }
  };

  if (loading || checking) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffd700', background: '#06060d' }}>
        Verificando credenciales de Dios...
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
