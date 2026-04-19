import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

// ── Paleta ────────────────────────────────────────────────────────────────────
const C = {
  bg: '#06060d',
  borderCyan: 'rgba(0,240,255,0.25)',
  cyan: '#00f0ff',
  purple: '#a78bfa',
};

// ── Hook responsive ───────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

// ── Frases del asistente ──────────────────────────────────────────────────────
const PABLO_MSGS = [
  '¡Hola! Crea presentaciones en bloques, sin plantillas. 🚀',
  'Usa el control remoto desde tu celular. 📱',
  'Mira lo que la comunidad está exponiendo hoy 👇',
  'La IA Pablito genera todo el contenido de tu expo. 🤖',
  '¡Únete gratis y crea en segundos! ✨',
  'Bloques de código, fórmulas LaTeX, timelines... 💻',
  'Publica y la comunidad puede clonar tu presentación. 🤝',
];

// ── Demo cards ────────────────────────────────────────────────────────────────
const DEMO_CARDS = [
  { id: 'd1', title: 'Inteligencia Artificial y el Futuro', author: 'pablito_expo', rank: '🏆 Leyenda', tags: ['IA', 'Tecnología'], bg: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=60&w=400' },
  { id: 'd2', title: 'Energías Renovables 2030', author: 'samuel_claudio', rank: '🎓 Maestro', tags: ['Ciencia', 'Ambiente'], bg: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=60&w=400' },
  { id: 'd3', title: 'Bases de Datos SQL vs NoSQL', author: 'dev_ana', rank: '📊 Expositor', tags: ['Código', 'BD'], bg: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=60&w=400' },
  { id: 'd4', title: 'Historia de la Computación', author: 'tech_hermit_99', rank: '🎓 Maestro', tags: ['Historia', 'Tech'], bg: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?q=60&w=400' },
  { id: 'd5', title: 'El ADN y la Genética Moderna', author: 'bioexpo_lab', rank: '📊 Expositor', tags: ['Biología', 'Ciencia'], bg: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=60&w=400' },
  { id: 'd6', title: 'Arquitectura de Microservicios', author: 'cloud_pablito', rank: '🔰 Novato', tags: ['Backend', 'AWS'], bg: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=60&w=400' },
];

// ── Input helper ──────────────────────────────────────────────────────────────
const inputStyle = {
  padding: '12px 16px', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
  color: '#fff', fontSize: '14px', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
};

// ── Auth Modal ────────────────────────────────────────────────────────────────
function AuthModal({ mode, onClose }) {
  const isMobile = useIsMobile();
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
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : '20px' }}
    >
      <motion.div
        initial={{ opacity: 0, y: isMobile ? 60 : 32, scale: isMobile ? 1 : 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: isMobile ? 80 : 0, scale: isMobile ? 1 : 0.95 }}
        transition={{ duration: 0.3 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: isMobile ? '100%' : '420px',
          background: '#0d0d18', border: `1px solid ${C.borderCyan}`,
          borderRadius: isMobile ? '24px 24px 0 0' : '24px',
          padding: isMobile ? '24px 20px 36px' : '32px',
          boxShadow: '0 0 60px rgba(0,240,255,0.08)',
          maxHeight: isMobile ? '92vh' : '90vh', overflowY: 'auto',
        }}
      >
        {/* Drag handle on mobile */}
        {isMobile && <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.15)', borderRadius: '2px', margin: '0 auto 20px' }} />}

        {/* Logo + tabs */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img src="/favicon.svg" alt="Pablito Expo" style={{ width: '44px', height: '44px', borderRadius: '12px', margin: '0 auto 14px', display: 'block', boxShadow: '0 0 20px rgba(0,240,255,0.3)' }} />
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '4px' }}>
            {['login', 'register'].map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); }}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '700', transition: 'all 0.2s',
                  background: tab === t ? 'linear-gradient(135deg,rgba(0,240,255,0.2),rgba(124,58,237,0.2))' : 'transparent',
                  color: tab === t ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                {t === 'login' ? 'Ingresar' : 'Crear cuenta'}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ background: 'rgba(255,60,60,0.08)', color: '#ff8888', border: '1px solid rgba(255,60,60,0.2)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px' }}>
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tab === 'register' && (
            <input type="text" placeholder="Apodo único (sin espacios)" value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
              required minLength={3} maxLength={30} style={inputStyle} />
          )}
          <input type="email" placeholder="Correo electrónico" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
          <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} style={inputStyle} />
          {tab === 'register' && (
            <>
              <input type="password" placeholder="Confirmar contraseña" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                style={{ ...inputStyle, borderColor: confirmPassword && confirmPassword !== password ? 'rgba(255,80,80,0.4)' : confirmPassword && confirmPassword === password ? 'rgba(0,240,100,0.3)' : 'rgba(255,255,255,0.1)' }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)}
                  style={{ accentColor: C.cyan, width: '16px', height: '16px', flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                  Acepto los{' '}
                  <Link to="/terms" target="_blank" style={{ color: C.cyan, textDecoration: 'none', fontWeight: '600' }}>Términos y Privacidad</Link>
                </span>
              </label>
            </>
          )}
          <button type="submit" disabled={loading}
            style={{ marginTop: '4px', padding: '14px', background: loading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,rgba(0,240,255,0.9),rgba(124,58,237,0.9))', border: 'none', borderRadius: '12px', color: loading ? 'rgba(255,255,255,0.3)' : '#000', fontWeight: '800', fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.03em', fontFamily: 'inherit' }}>
            {loading ? 'Procesando...' : tab === 'login' ? 'INGRESAR' : 'CREAR CUENTA GRATIS'}
          </button>
        </form>

        <button onClick={onClose}
          style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>
          Cancelar
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Asistente Pablo ───────────────────────────────────────────────────────────
function PablitoAssistant({ onCTA }) {
  const isMobile = useIsMobile();
  const [msgIdx, setMsgIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const [minimized, setMinimized] = useState(isMobile); // minimizado por defecto en móvil

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setMsgIdx(i => (i + 1) % PABLO_MSGS.length); setVisible(true); }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const bottom = isMobile ? '16px' : '24px';
  const right = isMobile ? '16px' : '24px';

  return (
    <div style={{ position: 'fixed', bottom, right, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
      <AnimatePresence>
        {!minimized && visible && (
          <motion.div
            key={msgIdx}
            initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            style={{ maxWidth: isMobile ? '220px' : '260px', background: 'rgba(13,13,24,0.97)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '16px 16px 4px 16px', padding: isMobile ? '12px 14px' : '14px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
          >
            <p style={{ margin: 0, fontSize: isMobile ? '12px' : '13px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
              {PABLO_MSGS[msgIdx]}
            </p>
            <button onClick={onCTA}
              style={{ marginTop: '8px', padding: '6px 12px', background: 'linear-gradient(135deg,rgba(0,240,255,0.2),rgba(124,58,237,0.2))', border: '1px solid rgba(0,240,255,0.25)', borderRadius: '8px', color: C.cyan, fontSize: '11px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
              Unirme gratis →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
        onClick={() => setMinimized(m => !m)}
        style={{ width: isMobile ? '46px' : '52px', height: isMobile ? '46px' : '52px', borderRadius: '50%', background: 'linear-gradient(135deg,#00f0ff,#7c3aed)', border: '2px solid rgba(0,240,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? '20px' : '22px', cursor: 'pointer', boxShadow: '0 0 24px rgba(0,240,255,0.3)', outline: 'none' }}>
        🤖
      </motion.button>
    </div>
  );
}

// ── Presentation Card ─────────────────────────────────────────────────────────
function PresentationCard({ item, onViewClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onClick={() => onViewClick(item)}
      style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', background: '#0d0d18', border: `1px solid ${hovered ? 'rgba(0,240,255,0.2)' : 'rgba(255,255,255,0.06)'}`, aspectRatio: '16/10', transition: 'box-shadow 0.3s, border-color 0.3s', boxShadow: hovered ? '0 0 24px rgba(0,240,255,0.15)' : 'none' }}
    >
      {item.bg && <img src={item.bg} alt="" fetchPriority="high" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: hovered ? 0.65 : 0.45, transition: 'opacity 0.3s' }} />}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(6,6,13,0.95) 0%, rgba(6,6,13,0.35) 60%, transparent 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
          {(item.tags || []).map(tag => (
            <span key={tag} style={{ fontSize: '9px', padding: '2px 7px', background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '20px', color: C.cyan, fontWeight: '700' }}>{tag}</span>
          ))}
        </div>
        <h3 style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: '800', color: '#fff', lineHeight: 1.3 }}>{item.title || 'Sin título'}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
            <img src="/favicon.svg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{item.author || 'Anónimo'}</span>
          {item.rank && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{item.rank}</span>}
        </div>
      </div>
      <AnimatePresence>
        {hovered && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ padding: '10px 18px', background: 'rgba(0,240,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(0,240,255,0.4)', borderRadius: '10px', color: C.cyan, fontSize: '12px', fontWeight: '700', letterSpacing: '0.05em' }}>
              👁️ VER PRESENTACIÓN
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Landing Page ──────────────────────────────────────────────────────────────
export default function LandingPage() {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [authModal, setAuthModal] = useState(null);
  const [publicPresentations, setPublicPresentations] = useState([]);
  const [loadingCards, setLoadingCards] = useState(true);

  useEffect(() => { if (user) navigate('/dashboard', { replace: true }); }, [user]);

  useEffect(() => {
    const fetchPublic = async () => {
      try {
        const { data } = await supabase.from('presentations').select('id, title, slug, created_at').is('deleted_at', null).limit(9);
        if (data && data.length > 0) {
          setPublicPresentations(data.map((p, i) => ({ id: p.id, title: p.title || 'Sin título', author: 'usuario', rank: '🔰 Novato', tags: ['Expo'], bg: DEMO_CARDS[i % DEMO_CARDS.length].bg, slug: p.slug })));
        }
      } catch { }
      finally { setLoadingCards(false); }
    };
    fetchPublic();
  }, []);

  const cards = publicPresentations.length > 0 ? publicPresentations : DEMO_CARDS;
  const handleViewCard = (item) => item.slug ? window.open(`#/projector/${item.slug}`, '_blank') : setAuthModal('register');

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Inter','Segoe UI',sans-serif", color: '#fff' }}>

      {/* ── HEADER ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(6,6,13,0.92)', backdropFilter: 'blur(20px)', padding: `0 ${isMobile ? '16px' : '32px'}` }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', height: isMobile ? '56px' : '62px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/favicon.svg" alt="Pablito Expo" style={{ width: isMobile ? '30px' : '36px', height: isMobile ? '30px' : '36px', borderRadius: '8px', boxShadow: '0 0 12px rgba(0,240,255,0.3)' }} />
            <span style={{ fontWeight: '800', fontSize: isMobile ? '14px' : '15px', letterSpacing: '-0.02em', background: 'linear-gradient(90deg,#00f0ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Pablito Expo
            </span>
          </div>

          {/* Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px' }}>
            {/* "Términos" solo en desktop */}
            {!isMobile && (
              <Link to="/terms" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', padding: '6px 10px', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>
                Términos
              </Link>
            )}
            <button onClick={() => setAuthModal('login')}
              style={{ padding: isMobile ? '8px 12px' : '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '10px', color: 'rgba(255,255,255,0.75)', fontSize: isMobile ? '13px' : '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}>
              Ingresar
            </button>
            <button onClick={() => setAuthModal('register')}
              style={{ padding: isMobile ? '8px 12px' : '8px 18px', background: 'linear-gradient(135deg,rgba(0,240,255,0.85),rgba(124,58,237,0.85))', border: 'none', borderRadius: '10px', color: '#000', fontSize: isMobile ? '13px' : '13px', fontWeight: '800', cursor: 'pointer', letterSpacing: '0.01em', fontFamily: 'inherit', boxShadow: '0 0 14px rgba(0,240,255,0.2)' }}>
              {isMobile ? 'Registrarse' : 'Crear Cuenta'}
            </button>
          </nav>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{ textAlign: 'center', padding: isMobile ? '48px 20px 32px' : '80px 24px 48px' }}>
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div style={{ display: 'inline-block', padding: '4px 14px', background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '20px', fontSize: isMobile ? '10px' : '11px', color: C.cyan, fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
            🚀 Plataforma de Presentaciones v2
          </div>
          <h1 style={{ margin: '0 0 14px', fontSize: isMobile ? '2rem' : 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: '900', letterSpacing: '-0.04em', lineHeight: 1.1, background: 'linear-gradient(135deg,#ffffff 0%,#a78bfa 50%,#00f0ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Presenta como un<br />profesional.
          </h1>
          <p style={{ margin: '0 auto 28px', maxWidth: '460px', fontSize: isMobile ? '14px' : '16px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, padding: isMobile ? '0 8px' : 0 }}>
            Editor en bloques, IA, control remoto en tu celular y galería comunitaria. Gratis para empezar.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', padding: '0 16px' }}>
            <button onClick={() => setAuthModal('register')}
              style={{ padding: isMobile ? '13px 24px' : '14px 28px', background: 'linear-gradient(135deg,#00f0ff,#7c3aed)', border: 'none', borderRadius: '12px', color: '#000', fontWeight: '800', fontSize: isMobile ? '14px' : '15px', cursor: 'pointer', letterSpacing: '0.02em', fontFamily: 'inherit', boxShadow: '0 0 28px rgba(0,240,255,0.25)', width: isMobile ? '100%' : 'auto' }}>
              Empezar gratis →
            </button>
            <button onClick={() => setAuthModal('login')}
              style={{ padding: isMobile ? '13px 24px' : '14px 28px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: '600', fontSize: isMobile ? '14px' : '15px', cursor: 'pointer', fontFamily: 'inherit', width: isMobile ? '100%' : 'auto' }}>
              Ya tengo cuenta
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: isMobile ? '12px' : '32px', justifyContent: 'center', marginTop: isMobile ? '32px' : '48px', maxWidth: isMobile ? '300px' : '500px', margin: `${isMobile ? '32px' : '48px'} auto 0` }}>
          {[{ val: '10+', label: 'Bloques' }, { val: 'IA', label: 'Asistente' }, { val: '📱', label: 'Remoto' }, { val: '∞', label: 'Expos' }].map(s => (
            <div key={s.val} style={{ textAlign: 'center', padding: isMobile ? '12px 8px' : '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: '900', color: C.cyan }}>{s.val}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── GALERÍA ── */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: `0 ${isMobile ? '16px' : '24px'} 80px` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: isMobile ? '1rem' : '1.2rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em' }}>
              🌐 Galería de la Comunidad
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
              {loadingCards ? 'Cargando...' : publicPresentations.length > 0 ? `${publicPresentations.length} presentaciones públicas` : 'Ejemplos de la comunidad'}
            </p>
          </div>
          <button onClick={() => setAuthModal('register')}
            style={{ padding: '8px 14px', background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '10px', color: C.cyan, fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            + Publicar la tuya
          </button>
        </div>

        {loadingCards ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>Cargando galería...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: isMobile ? '12px' : '16px' }}>
            {cards.map(item => <PresentationCard key={item.id} item={item} onViewClick={handleViewCard} />)}
          </div>
        )}

        {/* CTA bottom */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ marginTop: '32px', textAlign: 'center', padding: isMobile ? '28px 20px' : '40px', background: 'rgba(0,240,255,0.03)', border: '1px solid rgba(0,240,255,0.1)', borderRadius: '20px' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: '800', color: '#fff' }}>¿Listo para crear la tuya?</h3>
          <p style={{ margin: '0 0 20px', color: 'rgba(255,255,255,0.4)', fontSize: isMobile ? '13px' : '14px' }}>Crea tu cuenta gratis y empieza en minutos.</p>
          <button onClick={() => setAuthModal('register')}
            style={{ padding: isMobile ? '13px 24px' : '13px 28px', background: 'linear-gradient(135deg,#00f0ff,#7c3aed)', border: 'none', borderRadius: '12px', color: '#000', fontWeight: '800', fontSize: '14px', cursor: 'pointer', letterSpacing: '0.02em', fontFamily: 'inherit', boxShadow: '0 0 20px rgba(0,240,255,0.2)' }}>
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
