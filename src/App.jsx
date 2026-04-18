import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import SiteFooter from './components/SiteFooter';
import GlobalAiCopilot from './components/GlobalAiCopilot';

// Import Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import ProjectorView from './pages/ProjectorView';
import RemoteControl from './pages/RemoteControl';
import TermsPage from './pages/TermsPage';

// Proteger rutas — redirige a landing si no hay sesión
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  return children;
};

// Footer solo en páginas normales (no editor / proyector / remoto)
function AppLayout() {
  const location = useLocation();
  const noFooterRoutes = ['/editor', '/projector', '/remote', '/dashboard'];
  const hideFooter = noFooterRoutes.some(r => location.pathname.startsWith(r));

  return (
    <>
      <Routes>
        {/* Pública — vitrina principal */}
        <Route path="/" element={<LandingPage />} />

        {/* Login standalone (por si alguien va directo a /login) */}
        <Route path="/login" element={<Login />} />

        {/* Protegidas */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/editor/:slug" element={<ProtectedRoute><Editor /></ProtectedRoute>} />
        <Route path="/remote/:slug" element={<ProtectedRoute><RemoteControl /></ProtectedRoute>} />

        {/* Completamente públicas */}
        <Route path="/projector/:slug" element={<ProjectorView />} />
        <Route path="/terms" element={<TermsPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!hideFooter && <SiteFooter />}
      
      {/* Asistente Flotante Global */}
      <GlobalAiCopilot />
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
