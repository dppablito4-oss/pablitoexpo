import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

// ── Paleta ────────────────────────────────────────────────────────────────────
const C = {
  bg: '#06060d',
  glass: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.07)',
  borderCyan: 'rgba(0,240,255,0.25)',
  cyan: '#00f0ff',
  purple: '#a78bfa',
  textMuted: 'rgba(255,255,255,0.45)',
};

// ── Frases del asistente ──────────────────────────────────────────────────────
const PABLO_MSGS = [
  '¡Hola! Crea presentaciones en bloques, sin plantillas rígidas. 🚀',
  'Usa el control remoto láser desde tu celular en cualquier proyección. 📱',
  'Mira lo que la comunidad está exponiendo hoy 👇',
  'La IA Pablito te ayuda a generar todo el contenido de tu expo. 🤖',
  '¡Únete gratis y empieza a crear en segundos! ✨',
  'Bloques de código, fórmulas LaTeX, timelines... todo en un solo editor. 💻',
  'Publica tu presentación y la comunidad podrá clonarla. 🤝',
];

// ── Cards de demo (fallback si no hay datos públicos) ─────────────────────────
const DEMO_CARDS = [
  { id: 'd1', title: 'Inteligencia Artificial y el Futuro', author: 'pablito_expo', rank: '🏆 Leyenda', tags: ['IA', 'Tecnología'], bg: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=60&w=400' },
  { id: 'd2', title: 'Energías Renovables 2030', author: 'samuel_claudio', rank: '🎓 Maestro', tags: ['Ciencia', 'Ambiente'], bg: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=60&w=400' },
  { id: 'd3', title: 'Bases de Datos SQL vs NoSQL', author: 'dev_ana', rank: '📊 Expositor', tags: ['Código', 'BD'], bg: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=60&w=400' },
  { id: 'd4', title: 'Historia de la Computación', author: 'tech_hermit_99', rank: '🎓 Maestro', tags: ['Historia', 'Tech'], bg: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?q=60&w=400' },
  { id: 'd5', title: 'El ADN y la Genética Moderna', author: 'bioexpo_lab', rank: '📊 Expositor', tags: ['Biología', 'Ciencia'], bg: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=60&w=400' },
  { id: 'd6', title: 'Arquitectura de Microservicios', author: 'cloud_pablito', rank: '🔰 Novato', tags: ['Backend', 'AWS'], bg: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=60&w=400' },
];

// ── Auth Modal (integrado, sin redirigir) ─────────────────────────────────────
function AuthModal({ mode, onClose }) {
  const [tab, setTab] = useState(mode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (tab === 'register') {
      if (username.trim().length < 3) return setError('El apodo debe tener al menos 3 caracteres.');
      if (/\s/.test(username)) return setError('El apodo no puede tener espacios.');
      if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
      if (password !== confirmPassword) return setError('Las contraseñas no coinciden.');
      if (!acceptedTerms) return setError('Debes aceptar los Términos y Condiciones.');
    }
    setLoading(true);
    try {
      if (tab === 'login') {
        const { error: e } = await signIn({ email, password });
        if (e) throw e;
        navigate('/dashboard');
      } else {
        const { error: e } = await signUp({ email, password, options: { data: { username: username.trim().toLowerCase() } } });
        if (e) throw e;
        const { error: le } = await signIn({ email, password });
        if (!le) navigate('/dashboard');
      }
    } catch (err) { setError(err.message || 'Error de autenticación'); }
    finally { setLoading(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '420px', background: '#0d0d18', border: `1px solid ${C.borderCyan}`, borderRadius: '24px', padding: '36px 32px', boxShadow: '0 0 60px rgba(0,240,255,0.08)' }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg,#00f0ff,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '900', color: '#000', margin: '0 auto 12px', boxShadow: '0 0 20px rgba(0,240,255,0.3)' }}>P</div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '4px' }}>
            {['login', 'register'].map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); }}
                style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '700', transition: 'all 0.2s',
                  background: tab === t ? 'linear-gradient(135deg,rgba(0,240,255,0.2),rgba(124,58,237,0.2))' : 'transparent',
                  color: tab === t ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                {t === 'login' ? 'Ingresar' : 'Crear cuenta'}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ background: 'rgba(255,60,60,0.08)', color: '#ff8888', border: '1px solid rgba(255,60,60,0.2)', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px' }}>
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tab === 'register' && (
            <input type="text" placeholder="Apodo único (sin espacios)" value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
              required minLength={3} maxLength={30}
              style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
          )}
          <input type="email" placeholder="Correo electrónico" value={email} onChange={e => setEmail(e.target.value)} required
            style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
          <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
            style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
          {tab === 'register' && (
            <>
              <input type="password" placeholder="Confirmar contraseña" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${confirmPassword && confirmPassword !== password ? 'rgba(255,80,80,0.4)' : confirmPassword && confirmPassword === password ? 'rgba(0,240,100,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '10px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)}
                  style={{ marginTop: '2px', accentColor: C.cyan, width: '14px', height: '14px' }} />
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                  Acepto los{' '}
                  <Link to="/terms" target="_blank" style={{ color: C.cyan, textDecoration: 'none', fontWeight: '600' }}>Términos y Privacidad</Link>
                </span>
              </label>
            </>
          )}
          <button type="submit" disabled={loading}
            style={{ marginTop: '4px', padding: '13px', background: loading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, rgba(0,240,255,0.85), rgba(124,58,237,0.85))', border: 'none', borderRadius: '12px', color: loading ? 'rgba(255,255,255,0.3)' : '#000', fontWeight: '800', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.04em', fontFamily: 'inherit' }}>
            {loading ? 'Procesando...' : tab === 'login' ? 'INGRESAR' : 'CREAR CUENTA GRATIS'}
          </button>
        </form>

        <button onClick={onClose}
          style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', fontSize: '12px' }}>
          Cancelar
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Asistente Pablo ───────────────────────────────────────────────────────────
function PablitoAssistant({ onCTA }) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMsgIdx(i => (i + 1) % PABLO_MSGS.length);
        setVisible(true);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
      {/* Bubble */}
      <AnimatePresence>
        {!minimized && visible && (
          <motion.div
            key={msgIdx}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.35 }}
            style={{ maxWidth: '260px', background: 'rgba(13,13,24,0.97)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '16px 16px 4px 16px', padding: '14px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(0,240,255,0.06)' }}
          >
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
              {PABLO_MSGS[msgIdx]}
            </p>
            <button onClick={onCTA}
              style={{ marginTop: '10px', padding: '6px 12px', background: 'linear-gradient(135deg,rgba(0,240,255,0.2),rgba(124,58,237,0.2))', border: '1px solid rgba(0,240,255,0.25)', borderRadius: '8px', color: C.cyan, fontSize: '11px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
              Unirme gratis →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar */}
      <motion.button
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
        onClick={() => setMinimized(m => !m)}
        style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg,#00f0ff,#7c3aed)', border: '2px solid rgba(0,240,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', cursor: 'pointer', boxShadow: '0 0 24px rgba(0,240,255,0.3)', outline: 'none' }}
        title={minimized ? 'Abrir Pablito' : 'Minimizar'}
      >
        🤖
      </motion.button>
    </div>
  );
}

// ── Community Card ────────────────────────────────────────────────────────────
function PresentationCard({ item, onViewClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', background: '#0d0d18', border: '1px solid rgba(255,255,255,0.06)', aspectRatio: '16/10', transition: 'box-shadow 0.3s, border-color 0.3s', boxShadow: hovered ? '0 0 24px rgba(0,240,255,0.15)' : 'none', borderColor: hovered ? 'rgba(0,240,255,0.2)' : 'rgba(255,255,255,0.06)' }}
    >
      {/* Background image */}
      {item.bg && (
        <img src={item.bg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5, transition: 'opacity 0.3s', ...(hovered ? { opacity: 0.65 } : {}) }} />
      )}
      {/* Gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(6,6,13,0.95) 0%, rgba(6,6,13,0.4) 60%, transparent 100%)' }} />

      {/* Content */}
      <div style={{ position: 'absolute', inset: 0, padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
          {(item.tags || []).map(tag => (
            <span key={tag} style={{ fontSize: '9px', padding: '2px 8px', background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '20px', color: C.cyan, fontWeight: '700', letterSpacing: '0.05em' }}>
              {tag}
            </span>
          ))}
        </div>
        <h3 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: '800', color: '#fff', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
          {item.title || 'Sin título'}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'linear-gradient(135deg,#00f0ff,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900', color: '#000' }}>
            {(item.author || 'U')[0].toUpperCase()}
          </div>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{item.author || 'Anónimo'}</span>
          {item.rank && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginLeft: '4px' }}>{item.rank}</span>}
        </div>
      </div>

      {/* Hover CTA */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <button
              onClick={() => onViewClick(item)}
              style={{ padding: '10px 20px', background: 'rgba(0,240,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(0,240,255,0.4)', borderRadius: '10px', color: C.cyan, fontSize: '12px', fontWeight: '700', cursor: 'pointer', letterSpacing: '0.06em', fontFamily: 'inherit' }}>
              👁️ VER PRESENTACIÓN
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Landing Page Principal ────────────────────────────────────────────────────
export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [authModal, setAuthModal] = useState(null); // null | 'login' | 'register'
  const [publicPresentations, setPublicPresentations] = useState([]);
  const [loadingCards, setLoadingCards] = useState(true);

  // Si ya está logueado, redirigir al Dashboard
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user]);

  // Intentar cargar presentaciones públicas de Supabase
  useEffect(() => {
    const fetchPublic = async () => {
      try {
        const { data } = await supabase
          .from('presentations')
          .select('id, title, slug, created_at')
          .is('deleted_at', null)
          .limit(9);
        if (data && data.length > 0) {
          // Map to card format
          setPublicPresentations(data.map((p, i) => ({
            id: p.id, title: p.title || 'Sin título', author: 'usuario', rank: '🔰 Novato',
            tags: ['Expo'],
            bg: DEMO_CARDS[i % DEMO_CARDS.length].bg,
            slug: p.slug,
          })));
        }
      } catch { /* silently fallback to demo */ }
      finally { setLoadingCards(false); }
    };
    fetchPublic();
  }, []);

  const cards = publicPresentations.length > 0 ? publicPresentations : DEMO_CARDS;

  const handleViewCard = (item) => {
    if (item.slug) {
      window.open(`#/projector/${item.slug}`, '_blank');
    } else {
      setAuthModal('register');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Inter','Segoe UI',sans-serif", color: '#fff' }}>

      {/* ── HEADER ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(6,6,13,0.9)', backdropFilter: 'blur(20px)', padding: '0 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#00f0ff,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '900', color: '#000', boxShadow: '0 0 16px rgba(0,240,255,0.3)' }}>P</div>
            <span style={{ fontWeight: '800', fontSize: '15px', letterSpacing: '-0.02em', background: 'linear-gradient(90deg,#00f0ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Pablito Expo
            </span>
          </div>

          {/* Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link to="/terms" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', padding: '6px 10px', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>
              Términos
            </Link>
            <button onClick={() => setAuthModal('login')}
              style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyan; e.currentTarget.style.color = C.cyan; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}>
              Ingresar
            </button>
            <button onClick={() => setAuthModal('register')}
              style={{ padding: '8px 18px', background: 'linear-gradient(135deg,rgba(0,240,255,0.85),rgba(124,58,237,0.85))', border: 'none', borderRadius: '10px', color: '#000', fontSize: '13px', fontWeight: '800', cursor: 'pointer', letterSpacing: '0.02em', fontFamily: 'inherit', boxShadow: '0 0 16px rgba(0,240,255,0.2)', transition: 'box-shadow 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 28px rgba(0,240,255,0.4)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 16px rgba(0,240,255,0.2)'}>
              Crear Cuenta
            </button>
          </nav>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{ textAlign: 'center', padding: '80px 24px 48px' }}>
        <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div style={{ display: 'inline-block', padding: '4px 14px', background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '20px', fontSize: '11px', color: C.cyan, fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '20px' }}>
            🚀 Plataforma de Presentaciones v2
          </div>
          <h1 style={{ margin: '0 0 16px', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '900', letterSpacing: '-0.04em', lineHeight: 1.1, background: 'linear-gradient(135deg,#ffffff 0%,#a78bfa 50%,#00f0ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Presenta como un<br />profesional.
          </h1>
          <p style={{ margin: '0 auto 32px', maxWidth: '520px', fontSize: '16px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
            Editor en bloques modulares, asistente de IA, control remoto en el celular y galería comunitaria. Todo gratis para empezar.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setAuthModal('register')}
              style={{ padding: '14px 28px', background: 'linear-gradient(135deg,#00f0ff,#7c3aed)', border: 'none', borderRadius: '12px', color: '#000', fontWeight: '800', fontSize: '15px', cursor: 'pointer', letterSpacing: '0.02em', fontFamily: 'inherit', boxShadow: '0 0 32px rgba(0,240,255,0.25)' }}>
              Empezar gratis →
            </button>
            <button onClick={() => setAuthModal('login')}
              style={{ padding: '14px 28px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: '600', fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit' }}>
              Ya tengo cuenta
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }}
          style={{ display: 'flex', gap: '32px', justifyContent: 'center', marginTop: '48px', flexWrap: 'wrap' }}>
          {[{ val: '10+', label: 'Tipos de bloques' }, { val: 'IA', label: 'Asistente P.A.B.L.O.' }, { val: '📱', label: 'Control remoto' }, { val: '∞', label: 'Presentaciones' }].map(s => (
            <div key={s.val} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '900', color: C.cyan }}>{s.val}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── GALERÍA ── */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em' }}>
              🌐 Galería de la Comunidad
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
              {loadingCards ? 'Cargando...' : publicPresentations.length > 0 ? `${publicPresentations.length} presentaciones públicas` : 'Ejemplos de la comunidad'}
            </p>
          </div>
          <button onClick={() => setAuthModal('register')}
            style={{ padding: '8px 14px', background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '10px', color: C.cyan, fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
            + Publicar la tuya
          </button>
        </div>

        {loadingCards ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>Cargando galería...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {cards.map(item => (
              <PresentationCard key={item.id} item={item} onViewClick={handleViewCard} />
            ))}
          </div>
        )}

        {/* CTA bottom */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ marginTop: '40px', textAlign: 'center', padding: '40px', background: 'rgba(0,240,255,0.03)', border: '1px solid rgba(0,240,255,0.1)', borderRadius: '20px' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '1.3rem', fontWeight: '800', color: '#fff' }}>
            ¿Listo para crear la tuya?
          </h3>
          <p style={{ margin: '0 0 20px', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
            Crea tu cuenta gratis y empieza a diseñar en minutos.
          </p>
          <button onClick={() => setAuthModal('register')}
            style={{ padding: '13px 28px', background: 'linear-gradient(135deg,#00f0ff,#7c3aed)', border: 'none', borderRadius: '12px', color: '#000', fontWeight: '800', fontSize: '14px', cursor: 'pointer', letterSpacing: '0.03em', fontFamily: 'inherit', boxShadow: '0 0 24px rgba(0,240,255,0.2)' }}>
            Unirme a la comunidad →
          </button>
        </motion.div>
      </section>

      {/* ── ASISTENTE ── */}
      <PablitoAssistant onCTA={() => setAuthModal('register')} />

      {/* ── AUTH MODAL ── */}
      <AnimatePresence>
        {authModal && <AuthModal mode={authModal} onClose={() => setAuthModal(null)} />}
      </AnimatePresence>
    </div>
  );
}
