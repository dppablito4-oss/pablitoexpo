import { lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import SiteFooter from './components/SiteFooter';
import GlobalAiCopilot from './components/GlobalAiCopilot';

// La Landing siempre se importa normal para proteger el LCP inicial
import LandingPage from './pages/LandingPage';

// Code Splitting: Las demás rutas se cargan "lazy" (bajo demanda)
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Editor = lazy(() => import('./pages/Editor'));
const ProjectorView = lazy(() => import('./pages/ProjectorView'));
const RemoteControl = lazy(() => import('./pages/RemoteControl'));
const TermsPage = lazy(() => import('./pages/TermsPage'));

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
      <Suspense fallback={<div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(0,240,255,0.5)', background: '#06060d'}}>Cargando módulo...</div>}>
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
      </Suspense>
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
