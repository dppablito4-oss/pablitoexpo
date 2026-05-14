import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useIsAdmin from '../hooks/useIsAdmin';

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const { isAdmin, checking } = useIsAdmin();

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
