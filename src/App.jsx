import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import SiteFooter from './components/SiteFooter';

// Import Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import ProjectorView from './pages/ProjectorView';
import RemoteControl from './pages/RemoteControl';

// Componente para proteger las rutas
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Componente para bloquear el login si ya está logueado
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
};

// Footer solo en páginas que no sean el editor ni el proyector full-screen
function AppLayout() {
  const location = useLocation();
  const noFooterRoutes = ['/editor', '/projector', '/remote'];
  const hideFooter = noFooterRoutes.some(r => location.pathname.startsWith(r));

  return (
    <>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/editor/:slug" element={<ProtectedRoute><Editor /></ProtectedRoute>} />
        <Route path="/projector/:slug" element={<ProjectorView />} />
        <Route path="/remote/:slug" element={<ProtectedRoute><RemoteControl /></ProtectedRoute>} />
      </Routes>
      {!hideFooter && <SiteFooter />}
    </>
  );
}

function App() {
  return (
    <Router>
      <div className="ambient-light"></div>
      <div className="ambient-light-2"></div>
      <AppLayout />
    </Router>
  );
}

export default App;
