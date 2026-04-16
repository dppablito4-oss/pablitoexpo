import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

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

function App() {
  return (
    <Router>
      <div className="ambient-light"></div>
      <div className="ambient-light-2"></div>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/editor/:id" element={<ProtectedRoute><Editor /></ProtectedRoute>} />
        <Route path="/projector/:id" element={<ProtectedRoute><ProjectorView /></ProtectedRoute>} />
        <Route path="/remote/:id" element={<ProtectedRoute><RemoteControl /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
